'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged, createSession, saveBelief, updateSessionStatus, getUserDoc } from '@/services/FirebaseService'
import GeminiLiveService from '@/services/GeminiLiveService'
import useMicrophone from '@/hooks/useMicrophone'
import useAudioPlayer from '@/hooks/useAudioPlayer'
import WaveformVisualizer from '@/components/WaveformVisualizer'
import useAppStore from '@/store/useAppStore'
import { sanitizeBeliefNode } from '@/utils/sanitize'
import AppLogo from '@/components/AppLogo'
import { audioManager } from '@/utils/audioManager'
import { getNodeDisplayInfo } from '@/utils/nodeTypes'
import { useSessionRecovery } from '@/hooks/useSessionRecovery'
import SessionRecoveryModal from '@/components/SessionRecoveryModal'

const MAX_BELIEFS = 5

export default function InterviewPage() {
  const router = useRouter()
  const { setUser, setSessionId, addBelief, resetBeliefs, beliefs, addTranscriptEntry, appendLastTranscriptEntry, clearTranscript, transcript, setIsInterviewing } = useAppStore()

  const [user, setLocalUser] = useState(null)
  const [sessionId, setLocalSessionId] = useState(null)
  const [agentStatus, setAgentStatus] = useState('connecting')
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showTranscript, setShowTranscript] = useState(true)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [micError, setMicError] = useState(null)
  const [micDisconnected, setMicDisconnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [showGlow, setShowGlow] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [transcriptScrollRef] = useState(() => ({ current: null }))
  const connectionTimerRef = useRef(null)
  const textInputRef = useRef(null)
  const prevBeliefCount = useRef(0)
  const pendingSavesRef = useRef([]) // Firebase save queue for offline scenarios
  const autoSaveIntervalRef = useRef(null)
  const sessionActiveRef = useRef(false) // true while interview is live

  const liveServiceRef = useRef(null)
  const sessionCreatedRef = useRef(false)

  const { saveDraft, clearDraft, hasDraft, draftData } = useSessionRecovery()

  const { isCapturing, hasPermission, error: micErr, start: startMic, stop: stopMic, getAnalyser: getMicAnalyser, streamRef } = useMicrophone()
  const { init: initAudioPlayer, playChunk, stopPlayback, stop: stopPlayer, getAnalyser: getPlayerAnalyser } = useAudioPlayer()

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push('/'); return }
      setLocalUser(u)
      setUser(u)
    })
    return () => unsub()
  }, [router, setUser])

  // Show recovery modal if draft exists (only once on mount)
  useEffect(() => {
    if (hasDraft) setShowRecoveryModal(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Beforeunload guard — warn user before closing tab mid-session
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!sessionActiveRef.current) return
      e.preventDefault()
      e.returnValue = 'Your session is in progress. Are you sure you want to leave? Your progress has been saved.'
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Retry pending Firebase saves when back online
  useEffect(() => {
    const flushQueue = async () => {
      if (pendingSavesRef.current.length === 0) return
      const queue = [...pendingSavesRef.current]
      pendingSavesRef.current = []
      for (const item of queue) {
        try { await saveBelief(item.uid, item.sessionId, item.belief) } catch {}
      }
    }
    window.addEventListener('online', flushQueue)
    return () => window.removeEventListener('online', flushQueue)
  }, [])

  // Initialize interview session
  useEffect(() => {
    if (!user || sessionCreatedRef.current) return
    sessionCreatedRef.current = true

    let cancelled = false

    const init = async () => {
      // Guard against React StrictMode double-invoke (mounts twice in dev)
      if (liveServiceRef.current) return
      // Set sentinel immediately so any concurrent second call bails out
      liveServiceRef.current = { endSession: () => {}, _sentinel: true }

      clearTranscript()
      resetBeliefs()

      // Start 30s connection timeout
      connectionTimerRef.current = setTimeout(() => {
        setConnectionError('timeout')
      }, 30000)

      // Create Firestore session
      let sid
      try {
        sid = await createSession(user.uid)
      } catch (err) {
        console.error('[Interview] Failed to create session:', err)
        liveServiceRef.current = null
        clearTimeout(connectionTimerRef.current)
        setConnectionError('session_failed')
        return
      }
      if (cancelled) { liveServiceRef.current = null; return }
      setLocalSessionId(sid)
      setSessionId(sid)
      setIsInterviewing(true)

      // Pre-warm the audio worklet so it doesn't drop the first chunk
      await initAudioPlayer()
      if (cancelled) { liveServiceRef.current = null; return }

      // Initialize Gemini Live
      const svc = new GeminiLiveService()

      // Fetch user's Gemini API key from Firestore
      let userGeminiKey = null
      try {
        const userDocData = await getUserDoc(user.uid)
        userGeminiKey = userDocData?.gemini_api_key || null
      } catch (e) {
        console.error('[Interview] Failed to fetch user doc:', e)
      }

      if (!userGeminiKey) {
        clearTimeout(connectionTimerRef.current)
        liveServiceRef.current = null
        setConnectionError('no_api_key')
        return
      }

      svc.init(userGeminiKey) // pass key for token generation

      svc.onAudioChunk = (chunk) => {
        playChunk(chunk)
        setAgentStatus('speaking')
      }

      svc.onInterruption = () => {
        stopPlayback()
        setAgentStatus('listening')
      }

      svc.onTranscript = (entry) => {
        addTranscriptEntry(entry)
      }

      // Streaming chunks: append words into the last agent bubble
      svc.onTranscriptChunk = (chunk) => {
        appendLastTranscriptEntry(chunk)
      }

      // Streaming user speech chunks: append into same user bubble
      svc.onInputTranscriptChunk = (chunk) => {
        appendLastTranscriptEntry(chunk)
      }

      svc.onTurnComplete = () => {
        setAgentStatus('listening')
      }

      svc.onBeliefFound = async (rawNode) => {
        const node = sanitizeBeliefNode(rawNode)
        addBelief(node)
        
        // Play the insight discovery sound via centralized manager
        audioManager.play('insight-found.mp3', 0.6)

        // Save to Firestore — queue if offline
        try {
          await saveBelief(user.uid, sid, { ...node, order_index: beliefs.length })
        } catch (err) {
          console.warn('[Interview] saveBelief failed, queuing:', err)
          pendingSavesRef.current.push({ uid: user.uid, sessionId: sid, belief: { ...node, order_index: beliefs.length } })
        }
        // Auto-save draft immediately on each new belief
        saveDraft({ beliefs: useAppStore.getState().beliefs, transcript: useAppStore.getState().transcript, sessionId: sid })
      }

      svc.onComplete = async () => {
        setAgentStatus('ending')
        await updateSessionStatus(user.uid, sid, 'structuring')
        await stopMic()
        await liveServiceRef.current?.endSession()
        // Trigger Agent 2 pipeline
        fetch('/api/structure-beliefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, sessionId: sid }),
        }).catch(console.error)
        // Navigate to processing screen
        router.push(`/processing?sessionId=${sid}&uid=${user.uid}`)
      }

      svc.onError = (e) => {
        console.error('[Interview] Session error:', e)
        clearTimeout(connectionTimerRef.current)
        setConnectionError(typeof e === 'string' ? e : e?.message || 'Connection lost')
      }

      // Gemini unexpected disconnect — auto-reconnect (max 3 attempts)
      svc.onUnexpectedClose = async () => {
        if (!sessionActiveRef.current) return
        const attempts = reconnectAttempts
        if (attempts >= 3) {
          setConnectionError('Connection lost after multiple retries.')
          return
        }
        setReconnecting(true)
        setReconnectAttempts(a => a + 1)
        try {
          await new Promise(r => setTimeout(r, 2000))
          await liveServiceRef.current?.reconnect?.()
          setReconnecting(false)
        } catch {
          setReconnecting(false)
          setConnectionError('Reconnection failed. Please retry.')
        }
      }

      try {
        await svc.startSession()
      } catch (err) {
        console.error('[Interview] Failed to start Gemini session:', err)
        liveServiceRef.current = null
        clearTimeout(connectionTimerRef.current)
        setConnectionError(err.message || 'Failed to start session')
        return
      }

      if (cancelled) { svc.endSession(); liveServiceRef.current = null; return }
      clearTimeout(connectionTimerRef.current)
      liveServiceRef.current = svc
      sessionActiveRef.current = true
      setAgentStatus('active')
      
      // Play the intro session swelling sound
      audioManager.play('session-enter.mp3', 0.5)

      try {
        await svc.triggerAgentStart()

        // Start mic and watch for physical disconnect
        await startMic(
          (pcm16) => svc?.sendAudio?.(pcm16),
          () => svc?.sendAudioStreamEnd?.()
        )

        // Monitor mic track for physical disconnect (e.g. headset unplugged)
        const tryWatchMicTrack = () => {
          try {
            // Access the stream through the microphone hook's internal ref if available
            const stream = window.__mindroots_mic_stream
            if (stream) {
              const track = stream.getAudioTracks()[0]
              if (track) {
                track.onended = () => {
                  setMicDisconnected(true)
                  setMicError('Microphone disconnected. Reconnect and retry.')
                }
              }
            }
          } catch {}
        }
        setTimeout(tryWatchMicTrack, 1000)

        // Auto-save draft every 30 seconds
        autoSaveIntervalRef.current = setInterval(() => {
          const state = useAppStore.getState()
          saveDraft({ beliefs: state.beliefs, transcript: state.transcript, sessionId: sid })
        }, 30000)

      } catch (err) {
        console.error('[Interview] Failed to start microphone:', err)
        setMicError(err.message || 'Microphone access denied')
        setAgentStatus('active')
        setShowTextInput(true)
      }
    }

    init()

    // Cleanup: cancel async init if StrictMode unmounts before it finishes
    return () => {
      cancelled = true
      sessionCreatedRef.current = false
      clearTimeout(connectionTimerRef.current)
      clearInterval(autoSaveIntervalRef.current)
    }
  }, [user])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionActiveRef.current = false
      clearInterval(autoSaveIntervalRef.current)
      stopMic()
      stopPlayer()
      liveServiceRef.current?.endSession()
    }
  }, [stopMic, stopPlayer])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight
    }
  }, [transcript])

  // Focus text input when shown
  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [showTextInput])

  // Trigger glow animation when beliefs are added
  useEffect(() => {
    if (beliefs.length > prevBeliefCount.current) {
      setShowGlow(true)
      const timer = setTimeout(() => setShowGlow(false), 1500)
      prevBeliefCount.current = beliefs.length
      return () => clearTimeout(timer)
    }
    prevBeliefCount.current = beliefs.length
  }, [beliefs.length])

  const handleSendText = () => {
    const msg = textInput.trim()
    if (!msg) return
    setTextInput('')
    // Actually send to Gemini Live (was missing before!)
    liveServiceRef.current?.sendText?.(msg)
    // Show the conversation panel automatically so user sees their message
    setShowTranscript(true)
  }

  const handleEndSession = async () => {
    setShowEndConfirm(false)
    setAgentStatus('ending')
    sessionActiveRef.current = false
    clearInterval(autoSaveIntervalRef.current)
    clearDraft() // Clean exit — remove saved draft
    await stopMic()
    await liveServiceRef.current?.endSession()
    if (sessionId && user) {
      await updateSessionStatus(user.uid, sessionId, 'structuring')
      fetch('/api/structure-beliefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, sessionId }),
      }).catch(console.error)
      router.push(`/processing?sessionId=${sessionId}&uid=${user.uid}`)
    } else {
      router.push('/')
    }
  }

  const statusLabels = {
    connecting: 'Connecting to your guide...',
    active: 'Listening to your journey...',
    speaking: 'Your guide is speaking...',
    listening: 'Listening to you...',
    ending: 'Capturing your beliefs...',
  }

  const currentAnalyser = agentStatus === 'speaking' ? getPlayerAnalyser() : getMicAnalyser()

  const handleRetryConnection = () => {
    setConnectionError(null)
    sessionCreatedRef.current = false
    liveServiceRef.current = null
    // Re-trigger init by clearing the guard
    window.location.reload()
  }

  return (
    <>
    {/* Session Recovery Modal — shown if a previous session was interrupted */}
    {showRecoveryModal && (
      <SessionRecoveryModal
        draftData={draftData}
        onResume={() => {
          // Restore beliefs and transcript from draft
          if (draftData?.beliefs) draftData.beliefs.forEach(b => addBelief(b))
          if (draftData?.transcript) draftData.transcript.forEach(t => addTranscriptEntry(t))
          setShowRecoveryModal(false)
        }}
        onDiscard={() => {
          clearDraft()
          setShowRecoveryModal(false)
        }}
      />
    )}

    <div className="h-screen overflow-hidden bg-[#0A0A0A] text-white flex flex-col font-inter">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Reconnecting banner */}
      <AnimatePresence>
        {reconnecting && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[150] flex items-center justify-center gap-2 py-2.5 bg-amber-500/90 text-amber-950 text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
            Reconnecting to your guide…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic disconnected banner */}
      <AnimatePresence>
        {micDisconnected && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[150] flex items-center justify-center gap-2 py-2.5 bg-red-500/90 text-white text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">mic_off</span>
            Microphone disconnected — reconnect and click Retry
            <button onClick={() => { setMicDisconnected(false); setMicError(null); window.location.reload() }}
              className="ml-3 px-3 py-1 bg-white/20 rounded-full text-xs font-bold hover:bg-white/30 transition-colors">
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 lg:px-12 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
        <AppLogo />

        <div className="flex items-center gap-6">
          {/* Belief counter */}
          <div className={`flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border transition-all duration-500 ${
            showGlow ? 'animate-belief-glow border-[#818CF8]/50' : 'border-white/10'
          }`}>
            <span className={`material-symbols-outlined text-[#818CF8] text-[18px] ${
              showGlow ? 'animate-fire-pulse' : ''
            }`}>local_fire_department</span>
            <span className="text-sm font-medium text-slate-300">
              <span className="hidden sm:inline">{beliefs.length} core beliefs excavated</span>
              <span className="inline sm:hidden">{beliefs.length}/{MAX_BELIEFS}</span>
            </span>
          </div>

          {/* End Session */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-semibold text-white/70 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">call_end</span>
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </header>

      {/* Belief type tags bar — below header, grouped by type */}
      <AnimatePresence>
        {beliefs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-30 flex flex-wrap gap-2 px-6 pt-3 pb-1 justify-center"
            style={{ marginTop: '72px' }}
          >
            {(() => {
              const seen = {}
              beliefs.forEach(b => {
                const type = b.node_type || 'BELIEF_NODE'
                if (!seen[type]) seen[type] = { belief: b, count: 0 }
                seen[type].count++
              })
              return Object.entries(seen).map(([type, { belief: b, count }]) => {
                const info = getNodeDisplayInfo(b)
                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    style={{ borderColor: info.color, color: info.color, background: `${info.color}12`, boxShadow: `0 0 14px -4px ${info.color}44` }}
                    className="border px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xl"
                  >
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>{info.icon}</span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.1em] whitespace-nowrap">{info.title}</span>
                    {count > 1 && (
                      <span className="text-[7px] font-black px-1 py-0.5 rounded-full" style={{ background: `${info.color}30` }}>× {count}</span>
                    )}
                  </motion.div>
                )
              })
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main — waveform + status, takes remaining space */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 min-h-0">
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Waveform */}
          <div className="flex items-end justify-center gap-1.5 h-28 sm:h-36 w-full max-w-2xl text-accent">
            <WaveformVisualizer
              analyser={currentAnalyser}
              isActive={isCapturing || agentStatus === 'speaking'}
              color={agentStatus === 'speaking' ? '#818CF8' : '#ffffff'}
            />
          </div>

          {/* Status text */}
          <div className="text-center">
            {micError && (
              <p className="text-amber-400 text-sm mb-2 flex justify-center items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Microphone unavailable — type your responses below
              </p>
            )}
            <p className="font-display text-xl md:text-2xl font-medium text-white max-w-2xl leading-relaxed">
              {(agentStatus === 'active' || agentStatus === 'listening') && (!isCapturing && micError)
                ? 'Following your text responses...'
                : statusLabels[agentStatus] || 'Ready'}
            </p>
            <p className="text-slate-400 mt-1 text-sm">
              {agentStatus === 'connecting' ? 'Establishing secure session...' : 'MindRoots is analyzing the patterns in your narrative.'}
            </p>
          </div>
        </div>
      </main>

      {/* Conversation Panel — toggleable, no page scroll — only this panel scrolls */}
      <AnimatePresence>
        {showTranscript && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 px-4 lg:px-8 max-w-3xl mx-auto w-full mb-2"
            style={{ maxHeight: '28vh' }}
          >
            <div
              ref={(el) => { transcriptScrollRef.current = el }}
              className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-4 h-full overflow-y-auto flex flex-col gap-4"
            >
              {transcript.length === 0 ? (
                <p className="text-slate-500 text-sm italic text-center py-4">Conversation will appear here...</p>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`shrink-0 size-8 rounded-full flex items-center justify-center border ${
                      entry.role === 'assistant'
                        ? 'bg-[#818CF8]/20 border-[#818CF8]/30 text-[#818CF8]'
                        : 'bg-white/10 border-white/20'
                    }`}>
                      {entry.role === 'assistant' ? (
                        <span className="material-symbols-outlined text-[16px]">psychology</span>
                      ) : user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">person</span>
                      )}
                    </div>
                    {/* Bubble */}
                    <div className={`flex flex-col gap-1 max-w-[75%] ${entry.role === 'user' ? 'items-end' : ''}`}>
                      <span className={`text-[10px] uppercase tracking-widest font-bold ${
                        entry.role === 'assistant' ? 'text-[#818CF8]' : 'text-slate-500'
                      }`}>
                        {entry.role === 'assistant' ? 'Agent' : 'You'}
                      </span>
                      <p className={`text-sm leading-relaxed ${
                        entry.role === 'user' ? 'text-white text-right' : 'text-slate-200'
                      }`}>
                        {entry.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {/* Typing indicator */}
              {agentStatus === 'speaking' && (
                <div className="flex gap-3">
                  <div className="shrink-0 size-8 rounded-full bg-[#818CF8]/20 border border-[#818CF8]/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#818CF8] text-[16px]">psychology</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#818CF8]">Agent</span>
                    <div className="flex gap-1.5 items-center mt-1">
                      <div className="size-1.5 rounded-full bg-[#818CF8]/60 animate-bounce" style={{animationDelay:'0ms'}} />
                      <div className="size-1.5 rounded-full bg-[#818CF8]/60 animate-bounce" style={{animationDelay:'150ms'}} />
                      <div className="size-1.5 rounded-full bg-[#818CF8]/60 animate-bounce" style={{animationDelay:'300ms'}} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer mic controls — pinned at bottom, compact */}
      <footer className="relative z-10 flex flex-col items-center gap-3 pb-4 sm:pb-6 px-6">
        <div className="flex gap-3 items-center">
          {/* Mic */}
          <button
            onClick={async () => {
              if (isCapturing) {
                audioManager.play('mic-off.wav', 0.4)
                stopMic()
              } else {
                audioManager.play('mic-on.wav', 0.4)
                try {
                  await startMic(
                    (pcm16) => liveServiceRef.current?.sendAudio?.(pcm16),
                    () => liveServiceRef.current?.sendAudioStreamEnd?.()
                  )
                  setMicError(null)
                  setMicDisconnected(false)
                } catch (err) {
                  setMicError(err.message || 'Microphone access denied')
                }
              }
            }}
            className={`size-14 rounded-full flex items-center justify-center hover:scale-105 transition-transform ${
              isCapturing ? 'bg-white text-[#0A0A0A]' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined font-bold">{isCapturing ? 'mic' : 'mic_off'}</span>
          </button>
          {/* Pause */}
          <button className="size-14 bg-white/5 border border-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">pause</span>
          </button>
          {/* Edit/type — toggles text input */}
          <button
            onClick={() => setShowTextInput(v => !v)}
            className={`size-14 rounded-full flex items-center justify-center transition-all ${
              showTextInput
                ? 'bg-[#818CF8] text-white shadow-lg shadow-[#818CF8]/30'
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
            title="Type your response"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
        {/* Toggle Conversation */}
        <button
          onClick={() => setShowTranscript(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">{showTranscript ? 'visibility_off' : 'forum'}</span>
          {showTranscript ? 'Hide Conversation' : 'Show Conversation'}
        </button>

        {/* Text input panel */}
        <AnimatePresence>
          {showTextInput && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-2xl"
            >
              <div className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
                <span className="material-symbols-outlined text-slate-500 text-[20px] shrink-0">edit</span>
                <input
                  ref={textInputRef}
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendText()}
                  placeholder="Type your response..."
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none"
                />
                <button
                  onClick={handleSendText}
                  disabled={!textInput.trim()}
                  className="shrink-0 w-9 h-9 rounded-xl bg-[#818CF8] flex items-center justify-center hover:bg-[#818CF8]/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-white text-[18px]">send</span>
                </button>
              </div>
              <p className="text-center text-[11px] text-slate-600 mt-2">Type instead of speaking &mdash; Press Enter to send</p>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>

      {/* ── Connection Error Overlay ── */}
      {connectionError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-sm bg-[#111118] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
              connectionError === 'no_api_key'
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <span className={`material-symbols-outlined text-3xl ${
                connectionError === 'no_api_key' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {connectionError === 'no_api_key' ? 'key' : connectionError === 'timeout' ? 'timer_off' : 'wifi_off'}
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">
              {connectionError === 'no_api_key' ? 'Gemini API Key Required' :
               connectionError === 'timeout' ? 'Connection timed out' :
               connectionError === 'session_failed' ? 'Couldn\'t start session' :
               'Connection lost'}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-7">
              {connectionError === 'no_api_key'
                ? 'You need to add your Gemini API key in Settings before starting an interview. It only takes a moment.'
                : connectionError === 'timeout'
                ? 'Could not connect to your guide within 30 seconds. Check your internet and try again.'
                : connectionError === 'session_failed'
                ? 'Failed to create your session. This could be a network issue — please try again.'
                : `An error occurred: ${connectionError}`}
            </p>
            <div className="flex flex-col gap-3">
              {connectionError === 'no_api_key' ? (
                <Link
                  href="/settings?tab=profile"
                  className="w-full py-3 bg-[#818CF8] text-white font-bold text-sm rounded-xl hover:bg-[#818CF8]/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#818CF8]/20"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  Go to Settings → Add API Key
                </Link>
              ) : (
                <button
                  onClick={handleRetryConnection}
                  className="w-full py-3 bg-[#818CF8] text-white font-bold text-sm rounded-xl hover:bg-[#818CF8]/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#818CF8]/20"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Retry Session
                </button>
              )}
              <Link
                href="/history"
                className="w-full py-3 bg-white/5 border border-white/10 text-slate-200 font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">folder_open</span>
                Go to Dashboard
              </Link>
              <Link
                href="/"
                className="text-slate-600 hover:text-slate-400 transition-colors text-xs font-medium"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirm Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-8 max-w-sm w-full mx-4 border border-white/10">
            <h3 className="font-display text-xl font-bold text-white mb-3">End this session?</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {beliefs.length > 0
                ? `You've excavated ${beliefs.length} belief${beliefs.length > 1 ? 's' : ''}. Your results will be processed and your Belief Origin Tree will be created.`
                : "No beliefs have been excavated yet. End anyway?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-medium text-white/60 hover:text-white hover:border-white/30 transition-all"
              >
                Continue Session
              </button>
              <button
                onClick={handleEndSession}
                className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-slate-100 transition-all"
              >
                End & Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </>
  )
}
