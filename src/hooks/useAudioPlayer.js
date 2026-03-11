import { useState, useRef, useCallback } from 'react'

export default function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioCtxRef = useRef(null)
  const workletNodeRef = useRef(null)
  const analyserRef = useRef(null)
  const isInitializedRef = useRef(false)
  
  const init = useCallback(async () => {
    if (isInitializedRef.current) return
    
    // Gemini output is natively 24000Hz PCM
    const ctx = new AudioContext({ sampleRate: 24000 })
    audioCtxRef.current = ctx
    
    await ctx.audioWorklet.addModule('/audio-processors/playback.worklet.js')
    
    const worklet = new AudioWorkletNode(ctx, 'pcm-processor')
    workletNodeRef.current = worklet
    
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser
    
    worklet.connect(analyser)
    analyser.connect(ctx.destination)
    
    isInitializedRef.current = true
  }, [])
  
  const playChunk = useCallback((base64String) => {
    if (!audioCtxRef.current || !workletNodeRef.current) return
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    
    setIsPlaying(true)
    
    const binary = atob(base64String)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const pcm16 = new Int16Array(bytes.buffer)
    const float32 = new Float32Array(pcm16.length)
    
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 32768.0 : 32767.0)
    }
    
    workletNodeRef.current.port.postMessage(float32.buffer, [float32.buffer])
  }, [])
  
  const stopPlayback = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage('flush')
    }
    setIsPlaying(false)
  }, [])
  
  const stop = useCallback(() => {
    stopPlayback()
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(console.error)
    }
    isInitializedRef.current = false
    audioCtxRef.current = null
    workletNodeRef.current = null
    analyserRef.current = null
    setIsPlaying(false)
  }, [stopPlayback])
  
  return {
    isPlaying,
    init,
    playChunk,
    stopPlayback,
    stop,
    getAnalyser: () => analyserRef.current,
  }
}
