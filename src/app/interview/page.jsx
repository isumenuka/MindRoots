'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged, createSession, saveBelief, updateSessionStatus } from '@/services/FirebaseService'
import GeminiLiveService from '@/services/GeminiLiveService'
import useMicrophone from '@/hooks/useMicrophone'
import useAudioPlayer from '@/hooks/useAudioPlayer'
import WaveformVisualizer from '@/components/WaveformVisualizer'
import useAppStore from '@/store/useAppStore'
import { sanitizeBeliefNode } from '@/utils/sanitize'
import AppLogo from '@/components/AppLogo'

const MAX_BELIEFS = 5

export default function InterviewPage() {
  const router = useRouter()
  const { setUser, setSessionId, addBelief, beliefs, addTranscriptEntry, appendLastTranscriptEntry, clearTranscript, transcript, setIsInterviewing } = useAppStore()

  const [user, setLocalUser] = useState(null)
  const [sessionId, setLocalSessionId] = useState(null)
  const [agentStatus, setAgentStatus] = useState('connecting') // connecting | active | speaking | listening | ending
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [micError, setMicError] = useState(null)
  const [transcriptScrollRef] = useState(() => ({ current: null }))
  const textInputRef = useRef(null)

  const liveServiceRef = useRef(null)
  const sessionCreatedRef = useRef(false)

  const { isCapturing, hasPermission, error: micErr, start: startMic, stop: stopMic, getAnalyser: getMicAnalyser } = useMicrophone()
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

      // Create Firestore session
      const sid = await createSession(user.uid)
      if (cancelled) { liveServiceRef.current = null; return }
      setLocalSessionId(sid)
      setSessionId(sid)
      setIsInterviewing(true)

      // Pre-warm the audio worklet so it doesn't drop the first chunk
      await initAudioPlayer()
      if (cancelled) { liveServiceRef.current = null; return }

      // Initialize Gemini Live
      const svc = new GeminiLiveService()
      svc.init() // API key managed server-side in backend/server.py

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
        // Save to Firestore
        await saveBelief(user.uid, sid, { ...node, order_index: beliefs.length })
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
        setAgentStatus('connecting')
      }

      try {
        await svc.startSession()
        if (cancelled) { svc.endSession(); liveServiceRef.current = null; return }
        liveServiceRef.current = svc
        setAgentStatus('active')

        // Prompt the agent to start with its opening greeting immediately
        await svc.triggerAgentStart()

        // Start capturing mic and sending audio
        await startMic(
          (pcm16) => svc.sendAudio(pcm16),
          () => svc.sendAudioStreamEnd()  // flush Gemini VAD on mic stop
        )
      } catch (err) {
        console.error('[Interview] Failed to start:', err)
        setMicError(err.message)
        setAgentStatus('active') // Still show UI
      }
    }

    init()

    // Cleanup: cancel async init if StrictMode unmounts before it finishes
    return () => {
      cancelled = true
      sessionCreatedRef.current = false
    }
  }, [user])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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

  const handleSendText = () => {
    const msg = textInput.trim()
    if (!msg) return
    setTextInput('')
    // Actually send to Gemini Live (was missing before!)
    liveServiceRef.current?.sendText(msg)
    // Show the conversation panel automatically so user sees their message
    setShowTranscript(true)
  }

  const handleEndSession = async () => {
    setShowEndConfirm(false)
    setAgentStatus('ending')
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-inter">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12 border-b border-white/5">
        <AppLogo />

        <div className="flex items-center gap-6">
          {/* Belief counter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-[#818CF8] text-[18px]">local_fire_department</span>
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

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Waveform */}
          <div className="flex items-end justify-center gap-1.5 h-48 w-full max-w-2xl text-accent">
            <WaveformVisualizer
              analyser={currentAnalyser}
              isActive={isCapturing || agentStatus === 'speaking'}
              color={agentStatus === 'speaking' ? '#818CF8' : '#ffffff'}
            />
          </div>

          {/* Status text */}
          <div className="text-center">
            {micError && (
              <p className="text-amber-400 text-sm mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Microphone unavailable — type your responses below
              </p>
            )}
            <p className="font-display text-2xl md:text-3xl font-medium text-white max-w-2xl leading-relaxed">
              {statusLabels[agentStatus] || 'Ready'}
            </p>
            <p className="text-slate-400 mt-2 text-sm">
              {agentStatus === 'connecting' ? 'Establishing secure session...' : 'MindRoots is analyzing the patterns in your narrative.'}
            </p>
          </div>
        </div>
      </main>

      {/* Conversation Panel — toggleable */}
      <AnimatePresence>
        {showTranscript && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 px-6 lg:px-8 max-w-3xl mx-auto w-full mb-4"
          >
            <div
              ref={(el) => { transcriptScrollRef.current = el }}
              className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-5 max-h-[260px] overflow-y-auto flex flex-col gap-5"
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

      {/* Footer mic controls */}
      <footer className="relative z-10 flex flex-col items-center gap-4 pb-10 px-6">
        <div className="flex gap-3 items-center">
          {/* Mic */}
          <button
            onClick={() => isCapturing
              ? stopMic()
              : startMic(
                  (pcm16) => liveServiceRef.current?.sendAudio(pcm16),
                  () => liveServiceRef.current?.sendAudioStreamEnd()
                )}
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
  )
}
