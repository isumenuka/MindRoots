'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { ttsService } from '@/services/TTSService'

/**
 * AudioPlayer — plays a real audio URL if provided,
 * or uses the Gemini TTS via TTSService for narrationText.
 * Props:
 *   src            – optional audio URL
 *   narrationText  – fallback TTS text when no src
 *   title          – display label
 */
export default function AudioPlayer({ src, narrationText, title = 'Session Audio' }) {
  const audioRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const [generatedUrl, setGeneratedUrl] = useState(null)

  const hasSrc = Boolean(src)
  const hasText = Boolean(narrationText)
  const isTTS = !hasSrc && hasText
  const hasAudio = hasSrc || hasText

  // The actual src we pass to the <audio> tag
  const activeSrc = hasSrc ? src : generatedUrl

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
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
  }, [activeSrc])

  const togglePlay = useCallback(async () => {
    if (!hasAudio || isLoading) return

    if (isTTS && !generatedUrl) {
      // Need to generate audio first via the Gemini TTS Service
      setIsLoading(true)
      try {
        const url = await ttsService.generateAudio(narrationText)
        setGeneratedUrl(url)
        // Wait for state to update and audio element to load the new src
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e))
            setIsPlaying(true)
          }
        }, 100)
      } catch (err) {
        console.error("Failed to generate TTS:", err)
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Standard play/pause
    const audio = audioRef.current
    if (!audio) return
    
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(e => console.error(e))
      setIsPlaying(true)
    }
  }, [hasAudio, isLoading, isTTS, generatedUrl, narrationText, isPlaying])

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = ratio * duration
  }

  return (
    <div className="flex items-center gap-4 flex-1 min-w-[280px]">
      {activeSrc && <audio ref={audioRef} src={activeSrc} preload="metadata" />}

      <button
        onClick={togglePlay}
        disabled={!hasAudio || isLoading}
        className="flex items-center justify-center rounded-full size-10 bg-[#818CF8] text-white hover:scale-105 hover:bg-[#6366f1] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(129,140,248,0.35)] relative"
      >
        {isLoading ? (
          <div className="absolute w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span className="material-symbols-outlined text-xl fill-1">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        )}
      </button>

      <div className="flex-1">
        <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
          <span>{title}</span>
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
