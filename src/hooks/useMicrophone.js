import { useState, useRef, useCallback } from 'react'

export default function useMicrophone() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState(null)

  const audioCtxRef = useRef(null)
  const streamRef = useRef(null)
  const sourceRef = useRef(null)
  const workletNodeRef = useRef(null)
  const analyserRef = useRef(null)

  const stop = useCallback(() => {
    setIsCapturing(false)

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(console.error)
      audioCtxRef.current = null
    }
    analyserRef.current = null
  }, [])

  const start = useCallback(async (onData, onStop) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      })
      
      setHasPermission(true)
      streamRef.current = stream

      const ctx = new AudioContext({ sampleRate: 16000 })
      audioCtxRef.current = ctx

      await ctx.audioWorklet.addModule('/audio-processors/capture.worklet.js')
      const worklet = new AudioWorkletNode(ctx, 'pcm-capture-processor')
      workletNodeRef.current = worklet

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      sourceRef.current = source

      source.connect(analyser)
      analyser.connect(worklet)
      worklet.connect(ctx.destination)

      worklet.port.onmessage = (e) => {
        const { event, buffer } = e.data
        if (event === 'data' && buffer && isCapturing) {
          // Convert Float32Array to base64
          const float32 = new Float32Array(buffer)
          const pcm16 = new Int16Array(float32.length)
          for (let i = 0; i < float32.length; i++) {
            const s = Math.max(-1, Math.min(1, float32[i]))
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
          }
          const bytes = new Uint8Array(pcm16.buffer)
          const binary = String.fromCharCode.apply(null, Array.from(bytes))
          const b64 = btoa(binary)
          onData(b64)
        }
      }

      setIsCapturing(true)
      setError(null)
    } catch (err) {
      console.error('Mic error:', err)
      setError(err)
      stop()
      if (onStop) onStop()
    }
  }, [stop, isCapturing])

  return {
    isCapturing,
    hasPermission,
    error,
    start,
    stop,
    getAnalyser: () => analyserRef.current,
  }
}
