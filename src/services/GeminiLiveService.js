/**
 * GeminiLiveService.js
 * Thin WebSocket client to the Python backend proxy.
 * All Gemini Live logic runs in Python (backend/server.py).
 *
 * Protocol:
 *   Browser → Python:
 *     { type: "audio",         data: "<base64 pcm16>" }
 *     { type: "text",          text: "..." }
 *     { type: "audio_end" }
 *     { type: "trigger_start" }
 *
 *   Python → Browser:
 *     { type: "ready" }
 *     { type: "audio",         data: "<base64 pcm16 @ 24kHz>" }
 *     { type: "transcript",    role: "user"|"assistant", text: "..." }
 *     { type: "interrupted" }
 *     { type: "turn_complete" }
 *     { type: "belief_node",   node: { ... } }
 *     { type: "complete" }
 *     { type: "error",         message: "..." }
 */

const PYTHON_WS_URL = 'ws://localhost:8000/ws'

class GeminiLiveService {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.beliefNodes = []
    this.fullTranscript = []

    // Callbacks — same API as before so the interview page doesn't change
    this.onAudioChunk = null      // cb(pcm16Bytes: Uint8Array)
    this.onTranscript = null      // cb({ role, text })
    this.onBeliefFound = null     // cb(beliefNode)
    this.onComplete = null        // cb()
    this.onError = null           // cb(error)
    this.onInterruption = null    // cb()
    this.onTurnComplete = null    // cb()
  }

  // Kept for API compatibility — no-op since auth is server-side
  init(_apiKey) {}

  async startSession() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(PYTHON_WS_URL)
      this.ws = ws

      ws.onopen = () => {
        console.log('[GeminiLive] Connected to Python proxy')
      }

      ws.onmessage = (event) => {
        let msg
        try { msg = JSON.parse(event.data) } catch { return }

        switch (msg.type) {
          case 'ready':
            this.isConnected = true
            console.log('[GeminiLive] Gemini session ready')
            resolve(this)
            break

          case 'audio': {
            const binary = atob(msg.data)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            this.onAudioChunk?.(bytes)
            break
          }

          case 'transcript':
            this.fullTranscript.push({ role: msg.role, text: msg.text })
            this.onTranscript?.({ role: msg.role, text: msg.text })
            break

          case 'interrupted':
            console.log('[GeminiLive] Interrupted')
            this.onInterruption?.()
            break

          case 'turn_complete':
            this.onTurnComplete?.()
            break

          case 'belief_node':
            this.beliefNodes.push(msg.node)
            this.onBeliefFound?.(msg.node)
            break

          case 'complete':
            this.onComplete?.()
            break

          case 'error':
            console.error('[GeminiLive] Server error:', msg.message)
            this.onError?.(new Error(msg.message))
            break
        }
      }

      ws.onerror = (e) => {
        console.error('[GeminiLive] WebSocket error:', e)
        if (!this.isConnected) {
          reject(new Error('Could not connect to Python backend on ws://localhost:8000/ws'))
        } else {
          this.onError?.(e)
        }
      }

      ws.onclose = (e) => {
        this.isConnected = false
        console.log('[GeminiLive] Connection closed:', e?.reason)
      }
    })
  }

  _send(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify(payload))
  }

  // Trigger agent's opening greeting
  async triggerAgentStart() {
    if (!this.isConnected) return
    await new Promise(r => setTimeout(r, 200))
    this._send({ type: 'trigger_start' })
  }

  // Send PCM16 audio chunk from mic (16kHz, mono)
  async sendAudio(pcm16Bytes) {
    if (!this.isConnected) return
    const bytes = new Uint8Array(pcm16Bytes)
    const chunkSize = 8192
    let binaryStr = ''
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binaryStr += String.fromCharCode.apply(null, chunk)
    }
    this._send({ type: 'audio', data: btoa(binaryStr) })
  }

  // Signal audio stream end (flushes Gemini VAD)
  async sendAudioStreamEnd() {
    if (!this.isConnected) return
    this._send({ type: 'audio_end' })
  }

  // Send text message
  async sendText(text) {
    if (!this.isConnected) return
    this._send({ type: 'text', text })
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
