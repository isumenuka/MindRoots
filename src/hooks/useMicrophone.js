/**
 * useMicrophone.js
 * Captures microphone audio as PCM16 at 16kHz using ScriptProcessorNode.
 * Sends audioStreamEnd signal to Gemini when mic stops so it can flush & respond faster.
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
    const onStreamEndRef = useRef(null)

  // VAD State Refs
  const vadStateRef = useRef({
    isSpeaking: false,
    silenceStart: 0,
    SILENCE_THRESHOLD: 0.015, // Volume below this is considered silence
    SILENCE_DURATION: 1200 // Wait 1.2s of silence before triggering end
  })

  const start = useCallback(async (onChunk, onStreamEnd) => {
    onChunkRef.current = onChunk
    onStreamEndRef.current = onStreamEnd ?? null
    // Reset VAD state
    vadStateRef.current.isSpeaking = false
    vadStateRef.current.silenceStart = 0

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

      const ctx = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = ctx

      const source = ctx.createMediaStreamSource(stream)

      // Analyser for waveform visualiser
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      source.connect(analyser)

      // Use 1024 buffer (64ms @ 16kHz)
      const processor = ctx.createScriptProcessor(1024, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0)
        
        // 1. Calculate RMS (Volume)
        let sumSquares = 0
        for (let i = 0; i < float32.length; i++) {
          sumSquares += float32[i] * float32[i]
        }
        const rms = Math.sqrt(sumSquares / float32.length)

        // 2. VAD Logic
        if (rms > vadStateRef.current.SILENCE_THRESHOLD) {
          // User is speaking
          vadStateRef.current.isSpeaking = true
          vadStateRef.current.silenceStart = 0
        } else if (vadStateRef.current.isSpeaking) {
          // User was speaking, but now it's quiet
          if (vadStateRef.current.silenceStart === 0) {
            vadStateRef.current.silenceStart = Date.now()
          } else if (Date.now() - vadStateRef.current.silenceStart > vadStateRef.current.SILENCE_DURATION) {
            // Silence persisted longer than duration! Trigger end.
            console.log('[useMicrophone] VAD triggered silence end')
            vadStateRef.current.isSpeaking = false
            vadStateRef.current.silenceStart = 0
            onStreamEndRef.current?.()
          }
        }

        // 3. Send audio chunk
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

    // Signal to Gemini that the audio stream has ended so it can flush & respond
    onStreamEndRef.current?.()
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
