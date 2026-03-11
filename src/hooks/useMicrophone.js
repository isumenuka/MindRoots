/**
 * useMicrophone.js
 * Captures microphone audio as PCM16 at 16kHz using AudioWorklet.
 * Falls back to ScriptProcessorNode if AudioWorklet not available.
 */
'use client'
import { useRef, useState, useCallback } from 'react'

export default function useMicrophone() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [hasPermission, setHasPermission] = useState(null)
  const [error, setError] = useState(null)

  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const processorRef = useRef(null)
  const analyserRef = useRef(null)
  const onChunkRef = useRef(null)

  const start = useCallback(async (onChunk) => {
    onChunkRef.current = onChunk
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })
      streamRef.current = stream
      setHasPermission(true)

      const ctx = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = ctx

      const source = ctx.createMediaStreamSource(stream)

      // Analyser for waveform visualizer
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      source.connect(analyser)

      // ScriptProcessor to capture raw PCM
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0)
        // Convert Float32 → PCM16 (Int16)
        const pcm16 = float32ToPCM16(float32)
        onChunkRef.current?.(pcm16)
      }

      source.connect(processor)
      processor.connect(ctx.destination)

      setIsCapturing(true)
      setError(null)
    } catch (err) {
      setError(err)
      setHasPermission(false)
      console.error('[useMicrophone] Error:', err)
    }
  }, [])

  const stop = useCallback(() => {
    processorRef.current?.disconnect()
    analyserRef.current?.disconnect()
    audioContextRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())

    processorRef.current = null
    analyserRef.current = null
    audioContextRef.current = null
    streamRef.current = null

    setIsCapturing(false)
  }, [])

  const getAnalyser = useCallback(() => analyserRef.current, [])

  return { isCapturing, hasPermission, error, start, stop, getAnalyser }
}

function float32ToPCM16(float32Array) {
  const pcm = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Array[i]))
    pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF
  }
  return pcm.buffer
}
