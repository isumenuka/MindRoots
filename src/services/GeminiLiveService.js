/**
 * GeminiLiveService.js
 * Browser connects directly to the Gemini Live API via WebSockets.
 * Relies on the MindRoots Python backend ONLY to securely fetch an Ephemeral Token.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

class GeminiLiveService {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.beliefNodes = []
    this.fullTranscript = []

    this.onAudioChunk = null      // cb(base64Audio: string)
    this.onTranscript = null      // cb({ role, text })
    this.onTranscriptChunk = null // cb(text) — streams partial agent text into existing bubble
    this.onInputTranscriptChunk = null // cb(text) — streams partial user text into existing bubble
    this.onBeliefFound = null     // cb(beliefNode)
    this.onComplete = null        // cb()
    this.onError = null           // cb(error)
    this.onInterruption = null    // cb()
    this.onTurnComplete = null    // cb()
    this._outputTranscriptBuffer = '' // accumulate streaming agent words
    this._inputTranscriptBuffer  = '' // accumulate streaming user words
  }

  // Kept for API compatibility, not used
  init(_apiKey) {}

  async startSession() {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Fetch Config
        const configRes = await fetch(`${BACKEND_URL}/api/config`)
        const config = await configRes.json()

        // 2. Fetch Ephemeral Token
        const tokenRes = await fetch(`${BACKEND_URL}/api/token`, { method: "POST" })
        if (!tokenRes.ok) throw new Error("Failed to get ephemeral token")
        const tokenData = await tokenRes.json()
        const token = tokenData.token

        // 3. Connect to Gemini Live natively (Must use BidiGenerateContentConstrained with Ephemeral Tokens)
        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`
        const ws = new WebSocket(url)
        this.ws = ws

        ws.onopen = () => {
          console.log('[GeminiLive] Connected directly to Google API')
          this.isConnected = true
          
          // Send setup message
          const setupMsg = this._buildSetupMessage(config)
          ws.send(JSON.stringify(setupMsg))
          
          resolve(this)
        }

        ws.onmessage = async (event) => {
          let data
          if (event.data instanceof Blob) {
            data = await event.data.text()
          } else {
            data = event.data
          }
          
          let msg
          try { msg = JSON.parse(data) } catch { return }

          const serverContent = msg.serverContent
          if (serverContent) {
            if (serverContent.interrupted) {
              console.log('[GeminiLive] Interrupted')
              this.onInterruption?.()
            }
            if (serverContent.turnComplete) {
              console.log('[GeminiLive] Turn complete')
              // Flush the buffered output transcript as one complete message
              if (this._outputTranscriptBuffer) {
                const text = this._outputTranscriptBuffer.trim()
                this._outputTranscriptBuffer = ''
                this.fullTranscript.push({ role: 'assistant', text })
                this._parseBeliefNodes(text)
              }
              this.onTurnComplete?.()
            }
            // Parse audio — flush user buffer first (model is now responding)
            if (serverContent.modelTurn?.parts) {
              if (this._inputTranscriptBuffer) {
                // Commit the full user sentence to fullTranscript (bubble already shown)
                this.fullTranscript.push({ role: 'user', text: this._inputTranscriptBuffer.trim() })
                this._inputTranscriptBuffer = ''
              }
              for (const part of serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  this.onAudioChunk?.(part.inlineData.data)
                }
                if (part.text) {
                  console.log("Model Text (Non-transcript):", part.text)
                }
              }
            }
            // Parse input transcript — buffer chunks into one user bubble per utterance
            if (serverContent.inputTranscription?.text) {
              const chunk = serverContent.inputTranscription.text
              if (!this._inputTranscriptBuffer) {
                // First chunk: create user bubble
                this._inputTranscriptBuffer = chunk
                this.onTranscript?.({ role: 'user', text: chunk })
              } else {
                // Subsequent chunks: append to existing bubble
                this._inputTranscriptBuffer += chunk
                this.onInputTranscriptChunk?.(chunk)
              }
            }
            // Parse output transcript — buffer chunks, emit one bubble per turn
            if (serverContent.outputTranscription?.text) {
              const chunk = serverContent.outputTranscription.text
              if (!this._outputTranscriptBuffer) {
                // First chunk: create an empty bubble then stream into it
                this._outputTranscriptBuffer = chunk
                const displayText = this._stripBeliefNodes(chunk)
                if (displayText) this.onTranscript?.({ role: 'assistant', text: displayText })
              } else {
                // Subsequent chunks: append to existing bubble
                this._outputTranscriptBuffer += chunk
                const displayChunk = this._stripBeliefNodes(chunk)
                if (displayChunk) this.onTranscriptChunk?.(displayChunk)
              }
            }
          } else if (msg.setupComplete) {
            console.log("🏁 Setup accepted by Gemini")
          } else if (msg.error) {
            console.error("Gemini Error:", msg.error)
            this.onError?.(new Error(msg.error.message || "Unknown error"))
          }
        }

        ws.onerror = (e) => {
          if (!this.isConnected) {
            reject(new Error('Direct WebSocket connection to Gemini failed'))
          } else {
            console.error("WebSocket Error:", e)
            this.onError?.(e)
          }
        }

        ws.onclose = () => {
          console.log('[GeminiLive] Connection closed')
          this.isConnected = false
        }

      } catch (err) {
        console.error("Failed to start session:", err)
        reject(err)
      }
    })
  }

  _buildSetupMessage(config) {
    let startSens = "START_SENSITIVITY_UNSPECIFIED"
    if (config.vad_start_sensitivity === "LOW") startSens = "START_SENSITIVITY_LOW"
    if (config.vad_start_sensitivity === "HIGH") startSens = "START_SENSITIVITY_HIGH"

    let endSens = "END_SENSITIVITY_UNSPECIFIED"
    if (config.vad_end_sensitivity === "LOW") endSens = "END_SENSITIVITY_LOW"
    if (config.vad_end_sensitivity === "HIGH") endSens = "END_SENSITIVITY_HIGH"

    const setup = {
      setup: {
        model: `models/${config.model || "gemini-2.5-flash-native-audio-preview-12-2025"}`,
        generationConfig: {
          responseModalities: ["AUDIO"],
          temperature: config.temperature ?? 1.0,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: config.voice || "Puck"
              }
            }
          }
        },
        systemInstruction: { parts: [{ text: config.system_prompt || config.default_system_prompt }] },
        proactivity: { proactiveAudio: config.enable_proactive_audio ?? true },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            silenceDurationMs: config.vad_silence_duration_ms || 500,
            prefixPaddingMs: config.vad_prefix_padding_ms || 500,
            startOfSpeechSensitivity: startSens,
            endOfSpeechSensitivity: endSens,
          }
        }
      }
    }

    if (config.enable_affective_dialog) {
        setup.setup.generationConfig.enableAffectiveDialog = true
    }

    // Always enable input and output transcription if admin config asks
    if (config.enable_input_transcription !== false) {
       setup.setup.inputAudioTranscription = {}
    }
    if (config.enable_output_transcription !== false) {
       setup.setup.outputAudioTranscription = {}
    }
    
    return setup
  }

  // Strip BELIEF_NODE: {...} blocks from text shown in the chat UI.
  // The raw buffer is kept intact for _parseBeliefNodes to process.
  // NOTE: Do NOT call .trim() here — each chunk is a single streamed word/space,
  //       trimming would eat the spaces between words and jam them together.
  _stripBeliefNodes(text) {
    return text
      .replace(/BELIEF_NODE:\s*\{[\s\S]*?\}/g, '')
      .replace(/`/g, '')
      .replace(/\n{3,}/g, '\n\n')
  }

  // Parse out Socratic Belief Nodes from raw AI output manually!
  _parseBeliefNodes(text) {
    const regex = /BELIEF_NODE:\s*(\{[\s\S]*?\})/g
    let match
    while ((match = regex.exec(text)) !== null) {
      try {
        const node = JSON.parse(match[1])
        this.beliefNodes.push(node)
        this.onBeliefFound?.(node)
      } catch (e) {
        // invalid JSON node
      }
    }
    
    if (text.toLowerCase().includes("your belief map is now being drawn")) {
      setTimeout(() => {
        this.onComplete?.()
      }, 1500)
    }
  }

  _send(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify(payload))
  }

  // Trigger agent's opening greeting
  async triggerAgentStart() {
    if (!this.isConnected) return
    // Small delay ensures setup is finished
    await new Promise(r => setTimeout(r, 400))
    this.sendText("Hello. I am ready to begin. Please greet me warmly and ask me to share a belief.")
  }

  // Send encoded PCM16 Base64 chunk to Gemini Native Endpoint
  async sendAudio(base64Audio) {
    if (!this.isConnected) return
    // Correct format: realtimeInput.audio (not deprecated mediaChunks)
    this._send({
      realtimeInput: {
        audio: {
          data: base64Audio,
          mimeType: "audio/pcm;rate=16000"
        }
      }
    })
  }

  async sendAudioStreamEnd() {
    // Signal end of audio stream so Gemini flushes its VAD buffer
    if (!this.isConnected) return
    this._send({ realtimeInput: { audioStreamEnd: true } })
  }

  // Send text message using clientContent
  async sendText(text) {
    if (!this.isConnected) return
    this._send({
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true
      }
    })
    this.fullTranscript.push({ role: 'user', text })
    this.onTranscript?.({ role: 'user', text })
  }

  async endSession() {
    if (this.ws) {
      try { this.ws.close() } catch {}
      this.ws = null
      this.isConnected = false
    }
  }

  getBeliefNodes() { return this.beliefNodes }
  getTranscript() { return this.fullTranscript }

  reset() {
    this.beliefNodes = []
    this.fullTranscript = []
  }
}

export default GeminiLiveService

