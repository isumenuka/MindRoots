/**
 * useAudioPlayer.js
 * Low-latency PCM16 playback using AudioWorklet streaming queue.
 * Gapless playback — no gaps between chunks from Gemini.
 * Instant interruption — clears the worklet queue immediately.
 */
'use client'
import { useRef, useCallback } from 'react'

export default function useAudioPlayer() {
  const ctxRef          = useRef(null)
  const workletNodeRef  = useRef(null)
  const analyserRef     = useRef(null)
  const initializedRef  = useRef(false)

  const ensureInit = useCallback(async () => {
    if (initializedRef.current) return
    initializedRef.current = true

    // 24kHz matches Gemini audio output sample rate
    const ctx = new AudioContext({ sampleRate: 24000 })
    ctxRef.current = ctx

    await ctx.audioWorklet.addModule('/audio-processors/playback.worklet.js')

    const worklet = new AudioWorkletNode(ctx, 'pcm-playback-processor')
    workletNodeRef.current = worklet

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser

    worklet.connect(analyser)
    analyser.connect(ctx.destination)
  }, [])

  const playChunk = useCallback(async (pcm16Bytes) => {
    // Lazily initialize on first audio chunk
    if (!initializedRef.current) await ensureInit()

    const ctx = ctxRef.current
    if (!ctx || !workletNodeRef.current) return

    if (ctx.state === 'suspended') await ctx.resume()

    // Convert PCM16 → Float32 for the worklet
    const int16   = new Int16Array(
      pcm16Bytes.buffer ? pcm16Bytes.buffer : pcm16Bytes,
      pcm16Bytes.byteOffset ?? 0,
      pcm16Bytes.byteLength ? pcm16Bytes.byteLength / 2 : pcm16Bytes.length
    )
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768
    }

    // Send to worklet — no AudioBufferSourceNode creation, zero scheduling overhead
    workletNodeRef.current.port.postMessage(float32)
  }, [ensureInit])

  // Instantly clear queued audio (called on Gemini interruption)
  const stopPlayback = useCallback(() => {
    workletNodeRef.current?.port.postMessage('interrupt')
  }, [])

  const stop = useCallback(() => {
    stopPlayback()
    ctxRef.current?.close()
    ctxRef.current = null
    workletNodeRef.current = null
    analyserRef.current = null
    initializedRef.current = false
  }, [stopPlayback])

  const getAnalyser = useCallback(() => analyserRef.current, [])

  return { playChunk, stopPlayback, stop, getAnalyser }
}
