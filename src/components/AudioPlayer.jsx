'use client'
import { useState, useRef, useEffect } from 'react'

export default function AudioPlayer({ src, title = 'Session Narration' }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100 || 0)
    }
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src])

  const togglePlay = () => {
    if (!audioRef.current || !src) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

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
      {src && <audio ref={audioRef} src={src} preload="metadata" />}

      <button
        onClick={togglePlay}
        disabled={!src}
        className="flex items-center justify-center rounded-full size-10 bg-white text-black hover:scale-105 transition-transform disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-xl fill-1">
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
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
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
