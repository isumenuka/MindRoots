export default class GeminiLiveService {
  constructor() {
    this.ws = null
    this.isConnected = false

    // Callbacks
    this.onAudioChunk = null
    this.onTranscript = null
    this.onInterruption = null
    this.onTurnComplete = null
    this.onBeliefFound = null
    this.onComplete = null
    this.onError = null
    
    // Extracted beliefs
    this.fullTranscript = []
    this.extractedBeliefs = 0
  }

  // Set up everything needed for the session
  init() {
    // We don't need to do any immediate setup since the server proxy handles config fetching and Gemini API key
  }

  // Connects to our Python backend WebSocket which proxies to Gemini Live
  async startSession() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to the local FastAPI python WebSocket
        const backendWsUrl = process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL.replace('http', 'ws') + '/ws'
          : 'ws://localhost:8000/ws'
          
        this.ws = new WebSocket(backendWsUrl)

        this.ws.onopen = () => {
          console.log('[GeminiLive] Connected to Python Proxy WebSocket')
          this.isConnected = true
          resolve()
        }

        this.ws.onmessage = this._handleMessage.bind(this)

        this.ws.onclose = (event) => {
          console.log('[GeminiLive] Python Proxy WebSocket Disconnected:', event)
          this.isConnected = false
          if (!event.wasClean && this.onError) {
             this.onError(new Error('WebSocket connection interrupted.'))
          }
        }

        this.ws.onerror = (err) => {
          console.error('[GeminiLive] WebSocket Error:', err)
          if (this.onError) this.onError(err)
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  _handleMessage(event) {
    try {
      const msg = JSON.parse(event.data)
      
      switch (msg.type) {
        case 'audio':
          if (this.onAudioChunk) {
            this.onAudioChunk(msg.data) // Base64 PCM 24khz
          }
          break
        
        case 'transcript':
          // { type: 'transcript', role: 'user'|'assistant', text: '...' }
          this.fullTranscript.push({ role: msg.role, text: msg.text })
          if (this.onTranscript) {
            this.onTranscript({ role: msg.role, text: msg.text })
          }
          this._checkTriggers(msg.text, msg.role)
          break
          
        case 'interrupted':
          if (this.onInterruption) this.onInterruption()
          break
          
        case 'turnComplete':
          if (this.onTurnComplete) this.onTurnComplete()
          break
          
        case 'error':
          if (this.onError) this.onError(new Error(msg.message))
          break
      }
    } catch (e) {
      console.warn("Failed to parse incoming WebSocket message:", e)
    }
  }

  // Triggered on start to get the model to speak first
  async triggerAgentStart() {
    this.sendText("Hello. I am ready to begin. Please greet me warmly and ask me to share a belief.")
  }

  // Send encoded PCM16 Base64 chunk to the Python proxy
  async sendAudio(base64Audio) {
    if (!this.isConnected) return
    this.ws.send(JSON.stringify({ audio: base64Audio }))
  }

  // Send an explicit end of stream token to force Gemini VAD pipeline to flush early
  async sendAudioStreamEnd() {
    if (!this.isConnected) return
    this.ws.send(JSON.stringify({ audioStreamEnd: true }))
  }

  // Send text message directly
  async sendText(text) {
    if (!this.isConnected) return
    this.ws.send(JSON.stringify({ text: text }))
    this.fullTranscript.push({ role: 'user', text })
    if (this.onTranscript) {
      this.onTranscript({ role: 'user', text })
    }
  }

  // End the session gracefully
  async endSession() {
    this.isConnected = false
    if (this.ws) {
      this.ws.close()
    }
  }

  _checkTriggers(text, role) {
    if (role === 'assistant') {
      const txt = text.toLowerCase()
      // Extract structure belief
      // Because we stream, this text chunk might not contain the full sentence.
      // But typically "I think we've found it" is sent in a reasonably complete block by Gemini before halting
      if (txt.includes("i think we've found it") || txt.includes("let me capture this belief now")) {
        console.log("Triggering belief extraction pipeline based on trigger phrase...")
        this._structureBeliefs()
      }
      
      // End trigger
      if (txt.includes("your belief map is now being drawn") || txt.includes("take about 30 seconds")) {
        if (this.onComplete) this.onComplete()
      }
    }
  }
  
  // Since we aren't using function calling via python right now, use Gemini Flash dynamically
  async _structureBeliefs() {
    try {
      const { structureBeliefs } = await import('./GeminiFlashService')
      const node = await structureBeliefs(this.fullTranscript)
      if (node && this.onBeliefFound) {
        this.extractedBeliefs++
        this.onBeliefFound(node)
      }
    } catch (e) {
      console.error("Failed to structure belief dynamically:", e)
    }
  }
}
