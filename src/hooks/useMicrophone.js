/**
 * useMicrophone.js
 * Low-latency microphone capture using AudioWorklet (off main thread).
 * Worklet handles Float32→Int16 conversion and buffering.
 * Sends audioStreamEnd signal on silence for fastest Gemini response.
 */
'use client'
import { useRef, useState, useCallback } from 'react'

const SILENCE_THRESHOLD = 0.012  // RMS below this = silence
const SILENCE_DURATION  = 1500   // ms of silence before triggering stream end

export default function useMicrophone() {
  const [isCapturing, setIsCapturing]   = useState(false)
  const [hasPermission, setHasPermission] = useState(null)
  const [error, setError]               = useState(null)

  const streamRef        = useRef(null)
  const audioCtxRef      = useRef(null)
  const workletNodeRef   = useRef(null)
  const analyserRef      = useRef(null)
  const onChunkRef       = useRef(null)
  const onStreamEndRef   = useRef(null)

  // VAD state (inside worklet message handler — main thread only reads)
  const vadRef = useRef({ isSpeaking: false, silenceStart: 0 })

  const start = useCallback(async (onChunk, onStreamEnd) => {
    onChunkRef.current     = onChunk
    onStreamEndRef.current = onStreamEnd ?? null
    vadRef.current = { isSpeaking: false, silenceStart: 0 }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      streamRef.current = stream
      setHasPermission(true)

      // AudioContext at 16kHz — matches Gemini input requirement
      const ctx = new AudioContext({ sampleRate: 16000 })
      audioCtxRef.current = ctx

      // Analyser for waveform visualiser (lightweight)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      // Load the worklet (served from public/audio-processors/)
      await ctx.audioWorklet.addModule('/audio-processors/capture.worklet.js')

      const workletNode = new AudioWorkletNode(ctx, 'audio-capture-processor')
      workletNodeRef.current = workletNode

      // Receive Int16 ArrayBuffer (zero-copy transfer from worklet)
      workletNode.port.onmessage = (e) => {
        const pcm16Buffer = e.data  // ArrayBuffer of Int16 samples

        // VAD: compute RMS from Int16
        const int16 = new Int16Array(pcm16Buffer)
        let sumSq = 0
        for (let i = 0; i < int16.length; i++) {
          const s = int16[i] / 32768
          sumSq += s * s
        }
        const rms = Math.sqrt(sumSq / int16.length)

        const vad = vadRef.current
        if (rms > SILENCE_THRESHOLD) {
          vad.isSpeaking = true
          vad.silenceStart = 0
        } else if (vad.isSpeaking) {
          if (vad.silenceStart === 0) {
            vad.silenceStart = Date.now()
          } else if (Date.now() - vad.silenceStart > SILENCE_DURATION) {
            console.log('[useMicrophone] VAD silence end')
            vad.isSpeaking = false
            vad.silenceStart = 0
            onStreamEndRef.current?.()
          }
        }

        // Send chunk to GeminiLiveService
        onChunkRef.current?.(pcm16Buffer)
      }

      // Wire: mic source → analyser → worklet
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      source.connect(workletNode)
      // No need to connect worklet to destination (capture only)

      setIsCapturing(true)
      setError(null)
    } catch (err) {
      setError(err)
      setHasPermission(false)
      console.error('[useMicrophone] Error:', err)
    }
  }, [])

  const stop = useCallback(() => {
    workletNodeRef.current?.port.close()
    workletNodeRef.current?.disconnect()
    analyserRef.current?.disconnect()
    audioCtxRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())

    workletNodeRef.current = null
    analyserRef.current = null
    audioCtxRef.current = null
    streamRef.current = null

    setIsCapturing(false)
    onStreamEndRef.current?.()
  }, [])

  const getAnalyser = useCallback(() => analyserRef.current, [])

  return { isCapturing, hasPermission, error, start, stop, getAnalyser }
}
