/**
 * useAudioPlayer.js
 * Plays raw PCM16 audio chunks received from Gemini Live API at 24kHz.
 * Supports stopPlayback() to clear queued audio on interruption.
 */
'use client'
import { useRef, useCallback } from 'react'

export default function useAudioPlayer() {
  const audioContextRef = useRef(null)
  const nextStartTimeRef = useRef(0)
  const analyserRef = useRef(null)
  const activeSourcesRef = useRef([])

  const ensureContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const ctx = new AudioContext({ sampleRate: 24000 })
      audioContextRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.connect(ctx.destination)
      analyserRef.current = analyser
      nextStartTimeRef.current = ctx.currentTime
    }
    return audioContextRef.current
  }, [])

  const playChunk = useCallback((pcm16Bytes) => {
    const ctx = ensureContext()
    if (ctx.state === 'suspended') ctx.resume()

    // Convert PCM16 bytes to Float32
    const int16 = new Int16Array(pcm16Bytes.buffer || pcm16Bytes)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000)
    buffer.getChannelData(0).set(float32)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(analyserRef.current || ctx.destination)

    const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current)
    source.start(startTime)
    nextStartTimeRef.current = startTime + buffer.duration

    // Track so we can stop on interruption
    activeSourcesRef.current.push(source)
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source)
    }
  }, [ensureContext])

  // Call this when Gemini sends an interruption signal
  const stopPlayback = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try { src.stop() } catch (_) {}
    }
    activeSourcesRef.current = []
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime
    }
  }, [])

  const stop = useCallback(() => {
    stopPlayback()
    audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current = null
    nextStartTimeRef.current = 0
  }, [stopPlayback])

  const getAnalyser = useCallback(() => analyserRef.current, [])

  return { playChunk, stopPlayback, stop, getAnalyser }
}
