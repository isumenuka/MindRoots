/**
 * capture.worklet.js  — runs off the main thread (AudioWorkletGlobalScope)
 * Buffers incoming 16kHz PCM Float32, converts to Int16, posts to main thread.
 * Buffer = 2048 samples = 128 ms @ 16kHz — good balance of latency vs packet size.
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 2048
    this.buffer = new Float32Array(this.bufferSize)
    this.bufferIndex = 0
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true

    const channel = input[0]
    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.bufferIndex++] = channel[i]
      if (this.bufferIndex >= this.bufferSize) {
        // Convert Float32 → Int16 in the worklet (off main thread — fast!)
        const int16 = new Int16Array(this.bufferSize)
        for (let j = 0; j < this.bufferSize; j++) {
          const s = Math.max(-1, Math.min(1, this.buffer[j]))
          int16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }
        // Transfer the ArrayBuffer (zero-copy)
        this.port.postMessage(int16.buffer, [int16.buffer])
        this.bufferIndex = 0
        this.buffer = new Float32Array(this.bufferSize)
      }
    }
    return true
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor)
