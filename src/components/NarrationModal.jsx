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

const PERSONAS = {
  sage: { label: 'The Sage', voice: 'Puck', style: 'A wise, empathetic narrator uncovering deep psychological roots. Calm yet profound tone.' },
  investigator: { label: 'The Investigator', voice: 'Aoede', style: 'An investigative, curious tone, analyzing connections logically but with warmth.' },
  healer: { label: 'The Healer', voice: 'Charon', style: 'A soft, soothing, and incredibly empathetic voice. Comforting and warm.' },
}

export default function NarrationModal({ beliefs = [], session = {}, narrationText = '', onClose }) {
  const [currentIdx, setCurrentIdx] = useState(-1) // -1 = intro
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showBeliefs, setShowBeliefs] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [persona, setPersona] = useState('sage')
  
  const audioRef = useRef(null)
  const intervalRef = useRef(null)
  const startRef = useRef(null)
  const durRef = useRef(0)

  // Web Audio Context Refs
  const audioCtxRef = useRef(null)
  const audioDestRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const isRecordingRef = useRef(false)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const canvasRef = useRef(null)
  const reqAnimRef = useRef(null)
  const droneNodeRef = useRef(null)

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
    cancelAnimationFrame(reqAnimRef.current)
    if (droneNodeRef.current && droneNodeRef.current.osc) {
      try { droneNodeRef.current.osc.stop() } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    isRecordingRef.current = false
    setIsRecording(false)
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.suspend()
    }
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      stopAll()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [stopAll, audioUrl])

  // Canvas visualizer loop
  const drawVisualizer = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) {
       reqAnimRef.current = requestAnimationFrame(drawVisualizer)
       return
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    ctx.clearRect(0, 0, width, height)

    const centerX = width / 2
    const centerY = height / 2
    const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
    const radius = 100 + (avg * 1.5)

    // Inner glow
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(129, 140, 248, ${0.05 + (avg / 255) * 0.1})`
    ctx.filter = 'blur(20px)'
    ctx.fill()
    ctx.filter = 'none'

    // Frequency ring
    ctx.beginPath()
    for (let i = 0; i < dataArray.length; i++) {
        const angle = (i / dataArray.length) * Math.PI * 2
        const r = radius * 0.8 + (dataArray[i] * 0.6)
        const x = centerX + Math.cos(angle) * r
        const y = centerY + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = `rgba(129, 140, 248, ${0.1 + (avg / 255) * 0.4})`
    ctx.lineWidth = 1.5
    ctx.stroke()

    reqAnimRef.current = requestAnimationFrame(drawVisualizer)
  }, [])

  // Handle window resize for canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth
        canvasRef.current.height = canvasRef.current.parentElement.clientHeight
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize() // Initial sizing
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      audioDestRef.current = audioCtxRef.current.createMediaStreamDestination()

      // Start generative ambient drone
      const droneOsc = audioCtxRef.current.createOscillator()
      droneOsc.type = 'sine'
      // Set initial state based on current persona
      if (persona === 'investigator') droneOsc.frequency.value = 110
      else if (persona === 'healer') droneOsc.frequency.value = 73.42
      else droneOsc.frequency.value = 55
      
      const droneFilter = audioCtxRef.current.createBiquadFilter()
      droneFilter.type = 'lowpass'
      if (persona === 'investigator') droneFilter.frequency.value = 300
      else if (persona === 'healer') droneFilter.frequency.value = 200
      else droneFilter.frequency.value = 150

      const droneGain = audioCtxRef.current.createGain()
      droneGain.gain.value = 0.08

      droneOsc.connect(droneFilter)
      droneFilter.connect(droneGain)
      droneGain.connect(audioCtxRef.current.destination)
      droneGain.connect(audioDestRef.current)
      droneOsc.start()
      droneNodeRef.current = { osc: droneOsc, filter: droneFilter }
      
      reqAnimRef.current = requestAnimationFrame(drawVisualizer)
    } else if (droneNodeRef.current) {
        // Update existing drone parameters dynamically if already initialized
        const now = audioCtxRef.current.currentTime
        const { osc, filter } = droneNodeRef.current
        if (persona === 'sage') {
            osc.frequency.setTargetAtTime(55, now, 1)
            filter.frequency.setTargetAtTime(150, now, 1)
        } else if (persona === 'investigator') {
            osc.frequency.setTargetAtTime(110, now, 1)
            filter.frequency.setTargetAtTime(300, now, 1)
        } else if (persona === 'healer') {
            osc.frequency.setTargetAtTime(73.42, now, 1)
            filter.frequency.setTargetAtTime(200, now, 1)
        }
    }

    // Connect TTS Audio to analyser (needs to happen even if context exists but source was cleared)
    if (audioCtxRef.current && audioRef.current && !sourceRef.current) {
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current)
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioCtxRef.current.destination)
      analyserRef.current.connect(audioDestRef.current)
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
  }

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

  const startRecordingStream = () => {
    if (!canvasRef.current || !audioCtxRef.current || !audioDestRef.current) return
    const canvasStream = canvasRef.current.captureStream(30)
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDestRef.current.stream.getAudioTracks()
    ])
    
    let options = { mimeType: 'video/webm;codecs=vp9,opus' }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8,opus' }
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' }
    }
    
    mediaRecorderRef.current = new MediaRecorder(combinedStream, options)
    recordedChunksRef.current = []
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data)
    }
    
    mediaRecorderRef.current.onstop = () => {
      if (recordedChunksRef.current.length === 0) return
      const blob = new Blob(recordedChunksRef.current, { type: options.mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `MindRoots_Documentary_${persona}.webm`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a) }, 100)
    }

    mediaRecorderRef.current.start(100)
    setIsRecording(true)
    isRecordingRef.current = true
  }

  const setupAudioElement = async (recordMode = false) => {
    try {
      if (!audioUrl || !audioRef.current || audioRef.current.src === '') {
        setIsGenerating(true)
        const url = await ttsService.generateAudio(fullScript, {
          voice: PERSONAS[persona].voice,
          style: PERSONAS[persona].style
        })
        setAudioUrl(url)
        
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ''
          if (sourceRef.current) {
            sourceRef.current.disconnect()
            sourceRef.current = null
          }
        }

        const audio = new Audio(url)
        audioRef.current = audio
      }

      initAudio()
      
      const audio = audioRef.current
      if (recordMode) {
        audio.currentTime = 0
        setProgress(0)
        setCurrentIdx(-1)
        setShowBeliefs([])
      }

      audio.onloadedmetadata = () => { durRef.current = audio.duration }
      
      audio.ontimeupdate = () => {
        const pct = (audio.currentTime / audio.duration) * 100
        setProgress(pct)

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
        if (isRecordingRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
          setIsRecording(false)
          isRecordingRef.current = false
        }
      }

      if (recordMode) {
        startRecordingStream()
      }

      try {
        await audio.play()
        setIsPlaying(true)
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
      } catch (playError) {
        if (playError.name !== 'AbortError') throw playError
      }

    } catch (error) {
      console.error('Failed to play/record narration:', error)
      setIsRecording(false)
      isRecordingRef.current = false
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      return
    }

    if (audioUrl && audioRef.current) {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
      } catch (playError) {
        if (playError.name !== 'AbortError') {
          console.error('Failed to resume narration:', playError)
        }
      }
      return
    }

    await setupAudioElement(false)
  }

  const handleRecord = async () => {
    if (isPlaying) stopAll()
    await setupAudioElement(true)
  }

  const handleClose = () => { stopAll(); onClose?.() }

  const formatTime = (pct) => {
    const elapsed = (pct / 100) * durRef.current
    const m = Math.floor(elapsed / 60)
    const s = Math.floor(elapsed % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden" style={{ animation: 'fadeIn 0.4s ease' }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      
      {/* Background Visualizer */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
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
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-600 font-mono">{formatTime(progress)}</span>
            
            <div className="relative group">
              <select 
                value={persona}
                onChange={(e) => {
                  setPersona(e.target.value)
                  setAudioUrl(null)
                  setProgress(0)
                  setCurrentIdx(-1)
                  setShowBeliefs([])
                }}
                disabled={isGenerating || isPlaying}
                className="appearance-none bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-slate-300 font-medium outline-none cursor-pointer disabled:opacity-50 transition-colors hover:bg-white/10"
              >
                {Object.entries(PERSONAS).map(([key, data]) => (
                  <option key={key} value={key} className="bg-slate-900">{data.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </div>
            </div>
          </div>

          <button onClick={handlePlay}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-[#4f46e5]/40 disabled:opacity-50"
            disabled={isRecording}
            style={{
              background: isPlaying && !isRecording ? 'rgba(129,140,248,0.1)' : 'transparent',
              border: '1px solid rgba(129,140,248,0.4)',
              color: '#818CF8'
            }}>
            <span className="material-symbols-outlined text-[18px]">
              {isGenerating && !isRecording ? 'sync' : isPlaying && !isRecording ? 'pause' : 'play_arrow'}
            </span>
            {isGenerating && !isRecording ? 'Loading...' : isPlaying && !isRecording ? 'Pause' : progress > 0 ? 'Resume' : 'Play'}
          </button>

          <button onClick={handleRecord}
            disabled={isGenerating}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-full font-bold text-sm transition-all disabled:opacity-50"
            style={{
              background: isRecording ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg,#4f46e5,#818CF8)',
              border: isRecording ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(129,140,248,0.4)',
              color: isRecording ? '#ef4444' : '#fff',
              boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.3)' : '0 0 20px rgba(129,140,248,0.3)'
            }}>
            <span className="relative flex h-3 w-3">
              {isRecording ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              )}
            </span>
            {isRecording ? 'Recording Video...' : 'Record & Download'}
          </button>

          <span className="text-[10px] text-slate-600 font-mono">
            {beliefs.length} beliefs
          </span>
        </div>
      </div>
    </div>
  )
}
