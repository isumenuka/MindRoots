'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * AudioPlayer — plays a real audio URL if provided,
 * or uses the browser Web Speech API (TTS) for narration_text.
 * Props:
 *   src            – optional audio URL
 *   narrationText  – fallback TTS text when no src
 *   title          – display label
 */
export default function AudioPlayer({ src, narrationText, title = 'Session Audio' }) {
  const audioRef = useRef(null)
  const utteranceRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isTTS, setIsTTS] = useState(false)
  const [ttsDuration, setTtsDuration] = useState(0)
  const [ttsStart, setTtsStart] = useState(null)
  const ttsTimerRef = useRef(null)

  const hasSrc = Boolean(src)
  const hasText = Boolean(narrationText)
  const hasAudio = hasSrc || hasText

  // ── Real audio listeners ──────────────────────────────────────────────────
  useEffect(() => {
    setIsTTS(!hasSrc && hasText)
  }, [hasSrc, hasText])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || isTTS) return
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100 || 0)
    }
    const onLoaded = () => setDuration(audio.duration)
    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0) }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src, isTTS])

  // ── TTS progress ticker ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !isTTS || !ttsStart) return
    ttsTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - ttsStart) / 1000
      const est = ttsDuration || 1
      setCurrentTime(elapsed)
      setProgress(Math.min((elapsed / est) * 100, 98))
    }, 250)
    return () => clearInterval(ttsTimerRef.current)
  }, [isPlaying, isTTS, ttsStart, ttsDuration])

  // ── Toggle play/pause ─────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!hasAudio) return

    if (isTTS) {
      if (isPlaying) {
        window.speechSynthesis.pause()
        setIsPlaying(false)
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
        setIsPlaying(true)
      } else {
        // Fresh start
        window.speechSynthesis.cancel()
        const text = narrationText || ''
        // Rough estimate: 140 words/min average TTS speed
        const words = text.split(/\s+/).length
        const estimatedSecs = Math.max((words / 140) * 60, 5)
        setTtsDuration(estimatedSecs)
        setTtsStart(Date.now())
        setDuration(estimatedSecs)
        setProgress(0)
        setCurrentTime(0)

        const utter = new SpeechSynthesisUtterance(text)
        utter.rate = 0.95
        utter.pitch = 1.0
        utter.volume = 1.0
        // Prefer a calm, neutral voice
        const voices = window.speechSynthesis.getVoices()
        const preferred = voices.find(v =>
          v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Samantha')
        )
        if (preferred) utter.voice = preferred

        utter.onend = () => {
          setIsPlaying(false)
          setProgress(100)
          setCurrentTime(estimatedSecs)
        }
        utter.onerror = () => setIsPlaying(false)
        utteranceRef.current = utter
        window.speechSynthesis.speak(utter)
        setIsPlaying(true)
      }
    } else {
      const audio = audioRef.current
      if (!audio) return
      if (isPlaying) { audio.pause(); setIsPlaying(false) }
      else { audio.play().catch(() => {}); setIsPlaying(true) }
    }
  }, [hasAudio, isTTS, isPlaying, narrationText])

  // Cleanup on unmount
  useEffect(() => () => {
    window.speechSynthesis?.cancel()
    clearInterval(ttsTimerRef.current)
  }, [])

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleSeek = (e) => {
    if (isTTS) return // Can't seek TTS
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = ratio * duration
  }

  return (
    <div className="flex items-center gap-4 flex-1 min-w-[280px]">
      {hasSrc && <audio ref={audioRef} src={src} preload="metadata" />}

      <button
        onClick={togglePlay}
        disabled={!hasAudio}
        className="flex items-center justify-center rounded-full size-10 bg-[#818CF8] text-white hover:scale-105 hover:bg-[#6366f1] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(129,140,248,0.35)]"
      >
        <span className="material-symbols-outlined text-xl fill-1">
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      <div className="flex-1">
        <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
          <span>{title}{isTTS && hasText ? ' (Narration)' : ''}</span>
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div
          className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-[#818CF8] rounded-full transition-all"
            style={{ width: `${progress}%`, transition: 'width 0.25s linear' }}
          />
        </div>
      </div>
    </div>
  )
}
