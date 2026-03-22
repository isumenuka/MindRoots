'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ttsService } from '@/services/TTSService'
import { getNodeDisplayInfo } from '@/utils/nodeTypes'

function AmbientRoots() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="amb" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0"/>
        </radialGradient>
        <filter id="ambBlur"><feGaussianBlur stdDeviation="8"/></filter>
      </defs>
      {/* Root lines emanating from center */}
      {Array.from({length: 20}, (_, i) => {
        const a = (i / 20) * Math.PI * 2
        const x1 = 50, y1 = 50
        const x2 = 50 + Math.cos(a) * 55
        const y2 = 50 + Math.sin(a) * 55
        const cx1 = 50 + Math.cos(a + 0.3) * 25
        const cy1 = 50 + Math.sin(a + 0.3) * 25
        return (
          <path key={i}
            d={`M ${x1}% ${y1}% Q ${cx1}% ${cy1}% ${x2}% ${y2}%`}
            stroke="#818CF8" strokeWidth="0.5" fill="none"
            strokeOpacity={0.1 + (i % 3) * 0.05}
          />
        )
      })}
      <ellipse cx="50%" cy="50%" rx="20%" ry="12%" fill="url(#amb)" filter="url(#ambBlur)" />
    </svg>
  )
}

const WEIGHT_COLORS = {
  profound: '#f87171', high: '#fb923c', medium: '#facc15', low: '#4ade80',
}

export default function NarrationModal({ beliefs = [], session = {}, narrationText = '', onClose }) {
  const [currentIdx, setCurrentIdx] = useState(-1) // -1 = intro
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showBeliefs, setShowBeliefs] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  
  const audioRef = useRef(null)
  const intervalRef = useRef(null)
  const startRef = useRef(null)
  const durRef = useRef(0)

  // Build full narration script
  const fullScript = narrationText ||
    [
      `This is the archaeology of your mind. What you are about to hear is the map of beliefs that have silently shaped every decision you have made.`,
      ...beliefs.map((b, i) => {
        const info = getNodeDisplayInfo(b)
        return `Insight ${i + 1}. ${info.title}. ${info.subtitle ? `Context: ${info.subtitle.replace(' • ', ' and ')}.` : ''} "${info.primaryText}". ${info.tooltip1Val ? `Impact: ${info.tooltip1Val}.` : ''}`
      }),
      `You now hold the map. The path forward is yours to walk.`
    ].join(' ')

  const beliefScripts = beliefs.map(b => {
    const info = getNodeDisplayInfo(b)
    return `"${info.primaryText}" — ${info.subtitle || info.title}.`
  })

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      stopAll()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [stopAll, audioUrl])

  // Sync belief cards to narration progress
  const startProgressTracker = (estimated) => {
    durRef.current = estimated
    startRef.current = Date.now()
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const pct = Math.min((elapsed / estimated) * 100, 99)
      setProgress(pct)

      // Advance belief cards
      const beliefDuration = estimated / Math.max(beliefs.length + 2, 1)
      const introDuration = beliefDuration
      const beliefIdx = Math.floor((elapsed - introDuration) / beliefDuration)
      setCurrentIdx(Math.min(beliefIdx, beliefs.length - 1))
      setShowBeliefs(prev => {
        const next = [...prev]
        if (beliefIdx >= 0 && beliefIdx < beliefs.length && !next.includes(beliefIdx)) {
          next.push(beliefIdx)
        }
        return next
      })
    }, 200)
  }

  const handlePlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      return
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
      return
    }

    // Generate audio for the first time
    try {
      setIsGenerating(true)
      const url = await ttsService.generateAudio(fullScript, {
        voice: 'Puck',
        style: 'A wise, empathetic narrator uncovering deep psychological roots. Calm yet profound tone.'
      })
      setAudioUrl(url)
      
      const audio = new Audio(url)
      audioRef.current = audio
      
      audio.onloadedmetadata = () => {
        durRef.current = audio.duration
      }

      audio.ontimeupdate = () => {
        const pct = (audio.currentTime / audio.duration) * 100
        setProgress(pct)

        // Advance belief cards based on progress
        const beliefDuration = audio.duration / Math.max(beliefs.length + 2, 1)
        const introDuration = beliefDuration
        const beliefIdx = Math.floor((audio.currentTime - introDuration) / beliefDuration)
        
        if (beliefIdx >= -1 && beliefIdx < beliefs.length) {
          setCurrentIdx(beliefIdx)
          if (beliefIdx >= 0 && !showBeliefs.includes(beliefIdx)) {
            setShowBeliefs(prev => [...new Set([...prev, beliefIdx])])
          }
        }
      }

      audio.onended = () => {
        setIsPlaying(false)
        setProgress(100)
        setCurrentIdx(beliefs.length)
      }

      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Failed to play narration:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => { stopAll(); onClose?.() }

  const formatTime = (pct) => {
    const elapsed = (pct / 100) * durRef.current
    const m = Math.floor(elapsed / 60)
    const s = Math.floor(elapsed % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black" style={{ animation: 'fadeIn 0.4s ease' }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <AmbientRoots />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#818CF8] animate-pulse" />
          <span className="text-[10px] text-[#818CF8] uppercase tracking-[0.2em] font-bold">
            MindRoots Documentary
          </span>
        </div>
        <button onClick={handleClose}
          className="text-slate-600 hover:text-slate-300 transition-colors text-sm">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-10">
        {/* Intro / session title */}
        <div className="text-center mb-12 max-w-xl">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#818CF8] mb-3">Belief Archaeology Report</p>
          <h1 className="text-3xl lg:text-4xl font-display font-black text-slate-100 leading-tight mb-2">
            {session?.dominant_theme || 'Your Belief Origins'}
          </h1>
          <p className="text-slate-600 text-sm">{beliefs.length} core belief{beliefs.length !== 1 ? 's' : ''} excavated</p>
        </div>

        {/* Belief cards — appear one by one */}
        {beliefs.length > 0 && (
          <div className="w-full max-w-2xl space-y-4 mb-10">
            {beliefs.map((b, i) => {
              const visible = showBeliefs.includes(i)
              const active = currentIdx === i
              const color = WEIGHT_COLORS[b.emotional_weight] || '#818CF8'
              return (
                <div key={i}
                  className="rounded-xl border p-5 transition-all duration-700"
                  style={{
                    opacity: visible ? 1 : 0.08,
                    transform: visible ? 'translateY(0)' : 'translateY(12px)',
                    borderColor: active ? color : 'rgba(255,255,255,0.06)',
                    background: active ? `rgba(${color === '#f87171' ? '248,113,113' : color === '#fb923c' ? '251,146,60' : '129,140,248'},0.05)` : '#0d1117',
                    boxShadow: active ? `0 0 20px ${color}22` : 'none',
                    animation: visible ? 'slideUp 0.5s ease forwards' : 'none',
                  }}>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                      <span className="text-[10px] font-black font-mono" style={{ color }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color }}>
                        {getNodeDisplayInfo(b).subtitle || getNodeDisplayInfo(b).title}
                      </p>
                      <p className="text-slate-200 font-semibold text-sm leading-snug mb-2">
                        "{getNodeDisplayInfo(b).primaryText}"
                      </p>
                      {getNodeDisplayInfo(b).tooltip1Val && (
                        <p className="text-slate-500 text-xs italic">{getNodeDisplayInfo(b).tooltip1Title}: {getNodeDisplayInfo(b).tooltip1Val}</p>
                      )}
                    </div>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 animate-pulse" style={{ background: color }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 border-t border-white/5 px-6 py-4">
        {/* Progress bar */}
        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-[#818CF8] to-[#a78bfa] rounded-full"
            style={{ width: `${progress}%`, transition: 'width 0.2s linear', boxShadow: '0 0 8px #818CF8aa' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-600 font-mono">{formatTime(progress)}</span>

          <button onClick={handlePlay}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-full font-bold text-sm transition-all"
            style={{
              background: isPlaying ? 'rgba(129,140,248,0.1)' : 'linear-gradient(135deg,#4f46e5,#818CF8)',
              border: '1px solid rgba(129,140,248,0.4)',
              color: '#fff',
              boxShadow: isPlaying ? 'none' : '0 0 20px rgba(129,140,248,0.3)'
            }}>
            <span className="material-symbols-outlined text-[18px]">
              {isGenerating ? 'sync' : isPlaying ? 'pause' : 'play_arrow'}
            </span>
            {isGenerating ? 'Generating Audio...' : isPlaying ? 'Pause' : progress > 0 ? 'Resume' : 'Play Documentary'}
          </button>

          <span className="text-[10px] text-slate-600 font-mono">
            {beliefs.length} beliefs
          </span>
        </div>
      </div>
    </div>
  )
}
