/**
 * playback.worklet.js — runs off the main thread
 * Queues incoming Float32 chunks and plays them gaplessly.
 * Receives "interrupt" string to clear the queue immediately.
 */
class PCMPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.queue = []     // Array of Float32Array chunks
    this.offset = 0     // Position within current chunk

    this.port.onmessage = (e) => {
      if (e.data === 'interrupt') {
        this.queue = []
        this.offset = 0
      } else if (e.data instanceof Float32Array) {
        this.queue.push(e.data)
      }
    }
  }

  process(inputs, outputs) {
    const out = outputs[0][0]
    let i = 0

    while (i < out.length && this.queue.length > 0) {
      const chunk = this.queue[0]
      const remaining = chunk.length - this.offset
      const toCopy = Math.min(remaining, out.length - i)

      out.set(chunk.subarray(this.offset, this.offset + toCopy), i)
      i += toCopy
      this.offset += toCopy

      if (this.offset >= chunk.length) {
        this.queue.shift()
        this.offset = 0
      }
    }

    // Fill silence if queue is empty
    while (i < out.length) out[i++] = 0

    return true
  }
}

registerProcessor('pcm-playback-processor', PCMPlaybackProcessor)
