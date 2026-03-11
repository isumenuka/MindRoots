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

  const init = useCallback(async () => {
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

  const playChunk = useCallback((pcm16Bytes) => {
    const ctx = ctxRef.current
    if (!ctx || !workletNodeRef.current) {
        console.warn('AudioPlayer not initialized, dropping chunk')
        return
    }

    if (ctx.state === 'suspended') ctx.resume()

    // Safely get Int16Array from the incoming Uint8Array
    // We MUST use slice() to ensure the buffer is byte-aligned and isolated,
    // otherwise new Int16Array() throws if byteOffset is not a multiple of 2
    const copy = pcm16Bytes.slice()
    const int16 = new Int16Array(copy.buffer)

    // Convert PCM16 → Float32 for the worklet
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768
    }

    // Send to worklet
    workletNodeRef.current.port.postMessage(float32)
  }, [])

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

  return { init, playChunk, stopPlayback, stop, getAnalyser }
}
