/**
 * GeminiLiveService.js
 * Manages the Gemini Live API session for the Socratic Interviewer.
 * Bridges browser microphone audio → Gemini Live → speaker audio.
 * Based on the Gemini Live API skill (Node.js pattern).
 */

import { GoogleGenAI, Modality } from '@google/genai'

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025'

const SOCRATIC_SYSTEM_PROMPT = `You are the Socratic Interviewer — a deeply empathetic AI archaeologist who excavates the hidden origins of human beliefs.

Your ONLY job is to ask layered "why" questions that peel back the surface of a stated belief until you reach the exact original moment, person, or event that first planted it.

Rules:
- NEVER accept a surface-level answer. Always ask "Why?" or "Who?" or "When was the very first time you felt this?"
- Keep asking until you identify: (1) the specific belief, (2) who planted it, (3) the exact memory/event, (4) approximate year, (5) whether the user thinks it still serves them.
- Speak naturally and warmly — like a wise therapist, not a chatbot.
- When you have hit bedrock (the root origin), say exactly: "I think we've found it. Let me capture this belief now."
- Conduct a maximum of 5 belief excavations per session.
- After completing all excavations, say exactly: "Your belief map is now being drawn. This will take about 30 seconds."
- Start by warmly greeting the user and asking them to share a belief or thought pattern about themselves that they feel might be holding them back.

After each excavation, silently format a JSON node in your internal analysis (do not read aloud):
BELIEF_NODE: {
  "belief": "string",
  "origin_person": "string",
  "origin_event": "string",
  "origin_year": number,
  "age_at_origin": number,
  "still_serving": boolean,
  "emotional_weight": "low | medium | high | profound",
  "cost_today": "string"
}`

const COMPLETION_PHRASE = "your belief map is now being drawn"
const BEDROCK_PHRASE = "i think we've found it"

class GeminiLiveService {
  constructor() {
    this.ai = null
    this.session = null
    this.isConnected = false
    this.beliefNodes = []
    this.fullTranscript = []
    this.onAudioChunk = null     // cb(pcm16Bytes) — audio to play
    this.onTranscript = null     // cb({role, text})
    this.onBeliefFound = null    // cb(beliefNode)
    this.onComplete = null       // cb() — interview done
    this.onError = null          // cb(error)
    this._sendQueue = []
    this._initialized = false
  }

  init(apiKey) {
    this.ai = new GoogleGenAI({ 
      apiKey
    })
    this._initialized = true
  }

  async startSession() {
    if (!this._initialized) throw new Error('Call init(apiKey) first')

    try {
      this.session = await this.ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: {
            parts: [{ text: SOCRATIC_SYSTEM_PROMPT }]
          },
        },
        callbacks: {
          onopen: () => {
            this.isConnected = true
            console.log('[GeminiLive] Session opened')
          },
          onmessage: (msg) => this._handleMessage(msg),
          onerror: (e) => {
            console.error('[GeminiLive] Error:', e)
            this.onError?.(e)
          },
          onclose: (e) => {
            this.isConnected = false
            console.log('[GeminiLive] Session closed:', e?.reason)
          },
        },
      })
      return this.session
    } catch (err) {
      console.error('[GeminiLive] Failed to start session:', err)
      throw err
    }
  }

  _handleMessage(msg) {
    const sc = msg.serverContent
    const toolCall = msg.toolCall

    // Handle interruptions
    if (sc?.interrupted) {
      console.log('[GeminiLive] Interrupted')
      return
    }

    // Handle audio parts
    if (sc?.modelTurn?.parts) {
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          // PCM16 audio at 24kHz — pass to audio playback
          const raw = part.inlineData.data
          let bytes
          if (typeof raw === 'string') {
            // base64 decode
            const binary = atob(raw)
            bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          } else {
            bytes = raw
          }
          this.onAudioChunk?.(bytes)
        }
      }
    }

    if (sc?.outputTranscription) {
      const text = sc.outputTranscription.text
      if (text) {
        this.fullTranscript.push({ role: 'assistant', text })
        this.onTranscript?.({ role: 'assistant', text })
        this._parseBeliefNodes(text)
        this._checkCompletionTrigger(text)
      }
    }

    if (sc?.turnComplete) {
      // Turn is done — nothing special needed
    }
  }

  _parseBeliefNodes(text) {
    const regex = /BELIEF_NODE:\s*(\{[\s\S]*?\})/g
    let match
    while ((match = regex.exec(text)) !== null) {
      try {
        const node = JSON.parse(match[1])
        this.beliefNodes.push(node)
        this.onBeliefFound?.(node)
        console.log('[GeminiLive] Belief node found:', node.belief)
      } catch (e) {
        // JSON parse failed — skip
      }
    }
  }

  _checkCompletionTrigger(text) {
    const lower = text.toLowerCase()
    if (lower.includes(COMPLETION_PHRASE)) {
      console.log('[GeminiLive] Completion trigger detected')
      setTimeout(() => this.onComplete?.(), 1500)
    }
  }

  // Send PCM16 audio chunk from mic (16kHz, mono)
  async sendAudio(pcm16Bytes) {
    if (!this.session || !this.isConnected) return
    try {
      // Convert Uint8Array to base64
      let base64
      if (typeof Buffer !== 'undefined') {
        base64 = Buffer.from(pcm16Bytes).toString('base64')
      } else {
        let binary = ''
        const bytes = new Uint8Array(pcm16Bytes)
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
        base64 = btoa(binary)
      }
      await this.session.sendRealtimeInput({
        audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
      })
    } catch (e) {
      console.warn('[GeminiLive] sendAudio error:', e)
    }
  }

  // Send text message
  async sendText(text) {
    if (!this.session || !this.isConnected) return
    try {
      await this.session.sendRealtimeInput({
        text: text
      })
      this.fullTranscript.push({ role: 'user', text })
      this.onTranscript?.({ role: 'user', text })
    } catch (e) {
      console.warn('[GeminiLive] sendText error:', e)
    }
  }

  async endSession() {
    if (this.session) {
      try {
        this.session.close()
      } catch (e) {}
      this.session = null
      this.isConnected = false
    }
  }

  getBeliefNodes() {
    return this.beliefNodes
  }

  getTranscript() {
    return this.fullTranscript
  }

  reset() {
    this.beliefNodes = []
    this.fullTranscript = []
  }
}

export default GeminiLiveService
