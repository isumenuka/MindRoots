/**
 * GeminiLiveService.js
 * Manages the Gemini Live API session for the Socratic Interviewer.
 * Bridges browser microphone audio → Gemini Live → speaker audio.
 */

import { GoogleGenAI } from '@google/genai'

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

class GeminiLiveService {
  constructor() {
    this.ai = null
    this.session = null
    this.isConnected = false
    this.beliefNodes = []
    this.fullTranscript = []

    // Callbacks
    this.onAudioChunk = null      // cb(pcm16Bytes)
    this.onTranscript = null      // cb({role, text})
    this.onBeliefFound = null     // cb(beliefNode)
    this.onComplete = null        // cb()
    this.onError = null           // cb(error)
    this.onInterruption = null    // cb() — AI was interrupted, clear audio queue

    this._initialized = false
    this._reconnectAttempts = 0
    this._maxReconnects = 3
    this._apiKey = null
  }

  init(apiKey) {
    this._apiKey = apiKey
    // Use v1alpha to enable proactive audio & affective dialog
    this.ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } })
    this._initialized = true
  }

  async startSession() {
    if (!this._initialized) throw new Error('Call init(apiKey) first')

    try {
      this.session = await this.ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: {
            parts: [{ text: SOCRATIC_SYSTEM_PROMPT }]
          },
          // Enable v1alpha features for significantly better voice interaction
          enableAffectiveDialog: true,
          proactivity: { proactiveAudio: true }
        },
        callbacks: {
          onopen: () => {
            this.isConnected = true
            this._reconnectAttempts = 0
            console.log('[GeminiLive] Session opened')
          },
          onmessage: (msg) => this._handleMessage(msg),
          onerror: (e) => {
            console.error('[GeminiLive] Error:', e)
            this.onError?.(e)
            this._attemptReconnect()
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

  async _attemptReconnect() {
    if (this._reconnectAttempts >= this._maxReconnects) {
      console.warn('[GeminiLive] Max reconnect attempts reached')
      return
    }
    this._reconnectAttempts++
    const delay = this._reconnectAttempts * 2000
    console.log(`[GeminiLive] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts})`)
    await new Promise(r => setTimeout(r, delay))
    try {
      await this.startSession()
      console.log('[GeminiLive] Reconnected successfully')
    } catch (err) {
      console.error('[GeminiLive] Reconnect failed:', err)
    }
  }

  _handleMessage(msg) {
    const sc = msg.serverContent

    // Handle interruptions — clear audio queue immediately
    if (sc?.interrupted) {
      console.log('[GeminiLive] Interrupted')
      this.onInterruption?.()
      return
    }

    // Handle audio output chunks
    if (sc?.modelTurn?.parts) {
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          const raw = part.inlineData.data
          let bytes
          if (typeof raw === 'string') {
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

    // AI speech transcript
    if (sc?.outputTranscription?.text) {
      const text = sc.outputTranscription.text
      this.fullTranscript.push({ role: 'assistant', text })
      this.onTranscript?.({ role: 'assistant', text })
      this._parseBeliefNodes(text)
      this._checkCompletionTrigger(text)
    }

    // User speech transcript (previously missing!)
    if (sc?.inputTranscription?.text) {
      const text = sc.inputTranscription.text
      this.fullTranscript.push({ role: 'user', text })
      this.onTranscript?.({ role: 'user', text })
    }

    // Turn complete — good time to switch UI back to 'listening'
    if (sc?.turnComplete) {
      this.onTurnComplete?.()
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
    if (text.toLowerCase().includes(COMPLETION_PHRASE)) {
      console.log('[GeminiLive] Completion trigger detected')
      setTimeout(() => this.onComplete?.(), 1500)
    }
  }

  // Trigger the agent to speak first by simulating a user message
  // using sendRealtimeInput, which is more reliable than sendClientContent.
  async triggerAgentStart() {
    if (!this.session || !this.isConnected) return
    try {
      await new Promise(r => setTimeout(r, 400))
      await this.session.sendRealtimeInput({ 
        text: 'Hello. I am ready to begin. Please greet me warmly and ask me to share a belief.'
      })
      console.log('[GeminiLive] Agent start triggered')
    } catch (e) {
      console.warn('[GeminiLive] triggerAgentStart error:', e)
    }
  }

  // Send PCM16 audio chunk from mic (16kHz, mono)
  async sendAudio(pcm16Bytes) {
    if (!this.session || !this.isConnected) return
    try {
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

  // Signal that the audio stream has ended (flushes Gemini's VAD buffer → faster response)
  async sendAudioStreamEnd() {
    if (!this.session || !this.isConnected) return
    try {
      await this.session.sendRealtimeInput({ audioStreamEnd: true })
      console.log('[GeminiLive] audioStreamEnd sent')
    } catch (e) {
      console.warn('[GeminiLive] sendAudioStreamEnd error:', e)
    }
  }

  // Send text message (correctly uses sendRealtimeInput)
  async sendText(text) {
    if (!this.session || !this.isConnected) return
    try {
      await this.session.sendRealtimeInput({ text })
      this.fullTranscript.push({ role: 'user', text })
      this.onTranscript?.({ role: 'user', text })
    } catch (e) {
      console.warn('[GeminiLive] sendText error:', e)
    }
  }

  async endSession() {
    if (this.session) {
      try { this.session.close() } catch (e) {}
      this.session = null
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
