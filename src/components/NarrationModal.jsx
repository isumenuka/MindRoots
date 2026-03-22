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
  
  // Web Audio Engine Refs (BufferSource approach — no <audio> element needed)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const audioDestRef = useRef(null)  // MediaStreamDestination for recording
  const bufferSourceRef = useRef(null)   // AudioBufferSourceNode (current TTS)
  const droneNodeRef = useRef(null)      // Ambient synth oscillator
  const audioBufRef = useRef(null)       // Decoded AudioBuffer (cached)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const isRecordingRef = useRef(false)
  const canvasRef = useRef(null)
  const reqAnimRef = useRef(null)
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

  // ── Stop everything ──────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    // Stop TTS buffer source
    if (bufferSourceRef.current) {
      try { bufferSourceRef.current.stop() } catch (e) {}
      bufferSourceRef.current = null
    }
    // Stop ambient drone
    if (droneNodeRef.current?.osc) {
      try { droneNodeRef.current.osc.stop() } catch (e) {}
      droneNodeRef.current = null
    }
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    // Fade out drone immediately on stop
    if (audioCtxRef.current && droneNodeRef.current && droneNodeRef.current.gain) {
      droneNodeRef.current.gain.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1)
    }

    isRecordingRef.current = false
    clearInterval(intervalRef.current)
    setIsRecording(false)
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

  // ── Ensure AudioContext + Analyser + Drone are running ──────────────────
  const ensureAudioCtx = useCallback(async () => {
    // Create a fresh AudioContext on first use
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      analyser.connect(ctx.destination)
      const dest = ctx.createMediaStreamDestination()
      audioDestRef.current = dest
      analyser.connect(dest)
    }

    // Always resume if suspended (browser auto-suspends after async gaps)
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume()
    }

    // Recreate drone if it was stopped (e.g., after stopAll)
    if (!droneNodeRef.current) {
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      const gain = ctx.createGain()
      gain.gain.value = 0.0 // MUTE initially, fade in during playback!

      if (persona === 'investigator') { osc.frequency.value = 110; filter.frequency.value = 300 }
      else if (persona === 'healer')  { osc.frequency.value = 73.42; filter.frequency.value = 200 }
      else                            { osc.frequency.value = 55;  filter.frequency.value = 150 }

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(analyserRef.current)
      osc.start()
      droneNodeRef.current = { osc, filter, gain }
    } else {
      // Update frequency for persona change
      const { osc, filter } = droneNodeRef.current
      const now = audioCtxRef.current.currentTime
      if (persona === 'investigator') {
        osc.frequency.setTargetAtTime(110, now, 1); filter.frequency.setTargetAtTime(300, now, 1)
      } else if (persona === 'healer') {
        osc.frequency.setTargetAtTime(73.42, now, 1); filter.frequency.setTargetAtTime(200, now, 1)
      } else {
        osc.frequency.setTargetAtTime(55, now, 1); filter.frequency.setTargetAtTime(150, now, 1)
      }
    }
  }, [persona])

  // Sync belief cards to narration progress via interval
  const startProgressTracker = (durationSecs) => {
    durRef.current = durationSecs
    startRef.current = Date.now()
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const pct = Math.min((elapsed / durationSecs) * 100, 99)
      setProgress(pct)
      const beliefDuration = durationSecs / Math.max(beliefs.length + 2, 1)
      const beliefIdx = Math.floor((elapsed - beliefDuration) / beliefDuration)
      setCurrentIdx(Math.min(beliefIdx, beliefs.length - 1))
      setShowBeliefs(prev => {
        if (beliefIdx >= 0 && beliefIdx < beliefs.length && !prev.includes(beliefIdx)) {
          return [...prev, beliefIdx]
        }
        return prev
      })
    }, 200)
  }

  const startRecordingStream = () => {
    if (!canvasRef.current || !audioCtxRef.current || !audioDestRef.current) return
    const canvasStream = canvasRef.current.captureStream(30)
    const combined = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDestRef.current.stream.getAudioTracks()
    ])
    let opts = { mimeType: 'video/webm;codecs=vp9,opus' }
    if (!MediaRecorder.isTypeSupported(opts.mimeType)) opts = { mimeType: 'video/webm;codecs=vp8,opus' }
    if (!MediaRecorder.isTypeSupported(opts.mimeType)) opts = { mimeType: 'video/webm' }

    mediaRecorderRef.current = new MediaRecorder(combined, opts)
    recordedChunksRef.current = []
    mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data) }
    mediaRecorderRef.current.onstop = () => {
      if (!recordedChunksRef.current.length) return
      const blob = new Blob(recordedChunksRef.current, { type: opts.mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'; a.href = url
      a.download = `MindRoots_Documentary_${persona}.webm`
      document.body.appendChild(a); a.click()
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a) }, 100)
    }
    mediaRecorderRef.current.start(100)
    setIsRecording(true)
    isRecordingRef.current = true
  }

  // ── Core play function using AudioBufferSourceNode ───────────────────────
  const playAudioBuffer = async (buffer, recordMode) => {
    const ctx = audioCtxRef.current
    if (!ctx || !analyserRef.current) return

    // Always resume — context may have auto-suspended after async operations
    if (ctx.state !== 'running') {
      try { await ctx.resume() } catch (e) {}
    }

    // Fade in the ambient cinematic drone now that playback is actually starting
    if (droneNodeRef.current && droneNodeRef.current.gain) {
      droneNodeRef.current.gain.gain.setTargetAtTime(0.06, ctx.currentTime, 0.5)
    }

    // Stop any previously playing TTS source
    if (bufferSourceRef.current) {
      try { bufferSourceRef.current.stop() } catch (e) {}
      bufferSourceRef.current = null
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(analyserRef.current)
    bufferSourceRef.current = source

    const dur = buffer.duration
    durRef.current = dur

    source.onended = () => {
      setIsPlaying(false)
      setProgress(100)
      setCurrentIdx(beliefs.length)
      clearInterval(intervalRef.current)
      
      // Fade out the drone when narration finishes
      if (audioCtxRef.current && droneNodeRef.current && droneNodeRef.current.gain) {
        droneNodeRef.current.gain.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5)
      }

      if (isRecordingRef.current && mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
        isRecordingRef.current = false
      }
    }

    if (recordMode) {
      setProgress(0); setCurrentIdx(-1); setShowBeliefs([])
      startRecordingStream()
    }

    source.start(0)
    setIsPlaying(true)
    startProgressTracker(dur)
  }

  // ── Main handler: use shared TTSService cache (same audio as Session Narration) ───
  const handlePlay = async () => {
    if (isPlaying) {
      stopAll()
      return
    }
    // ensureAudioCtx is now async — must await so context is running before decode
    await ensureAudioCtx()
    try {
      setIsGenerating(true)
      if (!audioBufRef.current || !audioUrl) {
        const audioData = await ttsService.getAudioData(fullScript, {
          voice: PERSONAS[persona].voice,
          style: PERSONAS[persona].style,
        })
        if (!audioData) throw new Error('TTS service returned no audio')
        
        // Re-ensure context is running after the long network request
        await ensureAudioCtx()

        setAudioUrl(audioData.blobUrl)

        const decodedBuffer = await audioCtxRef.current.decodeAudioData(audioData.arrayBuffer)
        audioBufRef.current = decodedBuffer
      }
      await playAudioBuffer(audioBufRef.current, false)
    } catch (err) {
      console.error('[Documentary] Audio play error:', err)
      setIsPlaying(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRecord = async () => {
    if (isPlaying) stopAll()
    ensureAudioCtx()
    try {
      setIsGenerating(true)
      // Always regenerate for recording to ensure clean start
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const resp = await fetch(`${BACKEND}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullScript,
          voice: PERSONAS[persona].voice,
          style: PERSONAS[persona].style,
        })
      })
      if (!resp.ok) throw new Error(`TTS error: ${resp.statusText}`)
      const arrayBuf = await resp.arrayBuffer()
      audioBufRef.current = await audioCtxRef.current.decodeAudioData(arrayBuf)
      setAudioUrl('cached')
      playAudioBuffer(audioBufRef.current, true)
    } catch (err) {
      console.error('[Documentary] Recording error:', err)
      setIsRecording(false)
      isRecordingRef.current = false
    } finally {
      setIsGenerating(false)
    }
  }

  // Canvas visualizer loop
  const drawVisualizer = useCallback(() => {
    if (!canvasRef.current) {
       reqAnimRef.current = requestAnimationFrame(drawVisualizer)
       return
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Ensure canvas dimensions match its container
    if (canvas.width === 0 || canvas.height === 0) {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || window.innerWidth
        canvas.height = canvas.parentElement.clientHeight || window.innerHeight
      }
    }

    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)

    const centerX = width / 2
    const centerY = height / 2

    let avg = 0
    let dataArray = null
    if (analyserRef.current) {
      dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
    }

    const radius = 80 + (avg * 1.2)

    // Inner glow (always visible, even without analyser data)
    const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5)
    glowGrad.addColorStop(0, `rgba(129,140,248,${0.08 + (avg / 255) * 0.12})`)
    glowGrad.addColorStop(1, 'rgba(129,140,248,0)')
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 1.5, 0, 2 * Math.PI)
    ctx.fillStyle = glowGrad
    ctx.fill()

    // Frequency ring (only if we have data)
    if (dataArray) {
      ctx.beginPath()
      for (let i = 0; i < dataArray.length; i++) {
          const angle = (i / dataArray.length) * Math.PI * 2
          const r = radius * 0.8 + (dataArray[i] * 0.5)
          const x = centerX + Math.cos(angle) * r
          const y = centerY + Math.sin(angle) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = `rgba(129, 140, 248, ${0.15 + (avg / 255) * 0.5})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      // Idle ring animation when no audio yet
      const t = Date.now() / 1000
      ctx.beginPath()
      for (let i = 0; i < 64; i++) {
        const angle = (i / 64) * Math.PI * 2
        const r = 80 + Math.sin(t * 2 + i * 0.2) * 10
        const x = centerX + Math.cos(angle) * r
        const y = centerY + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.2)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    reqAnimRef.current = requestAnimationFrame(drawVisualizer)
  }, [])

  // Handle window resize for canvas + start idle visualizer loop on mount
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth || window.innerWidth
        canvasRef.current.height = canvasRef.current.parentElement.clientHeight || window.innerHeight
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    // Start the visualizer loop immediately so the idle animation runs
    reqAnimRef.current = requestAnimationFrame(drawVisualizer)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(reqAnimRef.current)
    }
  }, [drawVisualizer])




  const handleClose = () => { stopAll(); onClose?.() }

  const formatTime = (pct) => {
    const elapsed = (pct / 100) * durRef.current
    const m = Math.floor(elapsed / 60)
    const s = Math.floor(elapsed % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95" style={{ animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 30px rgba(129,140,248,0.2)}50%{box-shadow:0 0 60px rgba(129,140,248,0.4)}}
      `}</style>

      {/* Outer top bar — sits above the frame */}
      <div className="w-full max-w-5xl flex items-center justify-between px-2 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#818CF8] animate-pulse" />
          <span className="text-[9px] text-[#818CF8] uppercase tracking-[0.25em] font-bold">MindRoots Documentary</span>
        </div>
        <button onClick={handleClose} className="text-slate-600 hover:text-slate-300 transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* ── 16:9 Cinema Frame ── */}
      <div className="relative w-full max-w-5xl" style={{ aspectRatio: '16/9', animation: 'pulseGlow 4s ease infinite' }}>
        {/* Canvas fills the 16:9 frame */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full rounded-xl"
          style={{ background: '#050810' }}
        />

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />

        {/* Ambient root lines */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none opacity-15">
          <AmbientRoots />
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
               style={{ animation: 'fadeIn 0.5s ease' }}>
            <span className="material-symbols-outlined text-4xl text-[#818CF8] animate-spin mb-4">graphic_eq</span>
            <p className="text-sm font-black text-white tracking-[0.3em] uppercase drop-shadow-md">
              Generating Narration
            </p>
            <p className="text-[10px] text-[#818CF8] mt-2 font-mono tracking-widest animate-pulse">
              [ SYNTHESIZING INTELLIGENCE ]
            </p>
          </div>
        )}

        {/* Title overlay — top of frame */}
        <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none transition-opacity duration-700"
             style={{ opacity: isGenerating ? 0.2 : 1 }}>
          <p className="text-[8px] uppercase tracking-[0.35em] text-[#818CF8] mb-1">Belief Archaeology Report</p>
          <h1 className="text-xl font-black text-slate-100 leading-tight drop-shadow-lg">
            {session?.dominant_theme || 'Your Belief Origins'}
          </h1>
          <p className="text-slate-500 text-[10px] mt-0.5">{beliefs.length} core belief{beliefs.length !== 1 ? 's' : ''} excavated</p>
        </div>

        {/* Belief cards — bottom-left overlay, scrollable */}
        {beliefs.length > 0 && (
          <div className="absolute bottom-16 left-0 right-0 px-6 space-y-2 overflow-y-auto max-h-[55%]"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {/* Added style injected below for webkit */}
            <style>{`.overflow-y-auto::-webkit-scrollbar { display: none; }`}</style>
            {beliefs.map((b, i) => {
              const visible = showBeliefs.includes(i)
              const active = currentIdx === i
              const color = WEIGHT_COLORS[b.emotional_weight] || '#818CF8'
              return (
                <div key={i}
                  className="rounded-lg border px-4 py-3 transition-all duration-700 backdrop-blur-md"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(10px)',
                    borderColor: active ? color : 'rgba(255,255,255,0.06)',
                    background: active
                      ? `rgba(${color === '#f87171' ? '248,113,113' : color === '#fb923c' ? '251,146,60' : '129,140,248'},0.08)`
                      : 'rgba(5,8,16,0.72)',
                    boxShadow: active ? `0 0 16px ${color}33` : 'none',
                    animation: visible ? 'slideUp 0.45s ease forwards' : 'none',
                  }}>
                  <div className="flex items-start gap-3">
                    <span className="text-[9px] font-black font-mono flex-shrink-0 mt-0.5" style={{ color }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] uppercase tracking-widest mb-0.5 truncate" style={{ color }}>
                        {getNodeDisplayInfo(b).subtitle || getNodeDisplayInfo(b).title}
                      </p>
                      <p className="text-slate-200 font-semibold text-xs leading-snug">
                        &ldquo;{getNodeDisplayInfo(b).primaryText}&rdquo;
                      </p>
                    </div>
                    {active && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 animate-pulse" style={{ background: color }} />}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Progress bar — bottom of frame */}
        <div className="absolute bottom-0 left-0 right-0 px-0 rounded-b-xl overflow-hidden">
          <div className="w-full h-[3px] bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#818CF8] to-[#a78bfa]"
              style={{ width: `${progress}%`, transition: 'width 0.2s linear', boxShadow: '0 0 6px #818CF8aa' }}
            />
          </div>
        </div>

        {/* Frame corner accents */}
        {[['top-0 left-0','border-t border-l rounded-tl-xl'],['top-0 right-0','border-t border-r rounded-tr-xl'],
          ['bottom-0 left-0','border-b border-l rounded-bl-xl'],['bottom-0 right-0','border-b border-r rounded-br-xl']
        ].map(([pos, cls], i) => (
          <div key={i} className={`absolute ${pos} w-4 h-4 ${cls} border-[#818CF8]/40`} />
        ))}
      </div>

      {/* Controls below the frame */}
      <div className="w-full max-w-5xl px-3 pt-4 pb-2">
        <div className="flex items-center justify-between">
          
          {/* Left: Play/Stop & Timer */}
          <div className="flex items-center gap-4">
            <button onClick={handlePlay}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all disabled:opacity-50"
              disabled={isGenerating && !isPlaying}
              style={{
                background: isPlaying ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)',
                border: isPlaying ? '1px solid rgba(129,140,248,0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: isPlaying ? '#818CF8' : '#e2e8f0'
              }}>
              {isGenerating && !isPlaying ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              ) : isPlaying ? (
                <span className="material-symbols-outlined text-[18px]">stop</span>
              ) : (
                <span className="material-symbols-outlined text-[18px] ml-0.5">play_arrow</span>
              )}
            </button>
            
            <span className="text-xs text-slate-500 font-mono tracking-wider">{formatTime(progress)}</span>
          </div>

          {/* Center: Belief Count indicator */}
          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-600 font-mono">{beliefs.length} BELIEFS EXTRACTED</span>
          </div>

          {/* Right: Settings / Persona Selector */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <select
                value={persona}
                onChange={(e) => {
                  setPersona(e.target.value)
                  setAudioUrl(null)
                  audioBufRef.current = null
                  setProgress(0)
                  setCurrentIdx(-1)
                  setShowBeliefs([])
                }}
                disabled={isGenerating || isPlaying}
                className="appearance-none bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-400 font-medium outline-none cursor-pointer disabled:opacity-50 transition-all"
              >
                {Object.entries(PERSONAS).map(([key, data]) => (
                  <option key={key} value={key} className="bg-slate-900 text-slate-200">{data.label}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-slate-300 transition-colors">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

