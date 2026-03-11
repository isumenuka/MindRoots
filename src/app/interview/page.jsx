'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged, createSession, saveBelief, updateSessionStatus } from '@/services/FirebaseService'
import GeminiLiveService from '@/services/GeminiLiveService'
import useMicrophone from '@/hooks/useMicrophone'
import useAudioPlayer from '@/hooks/useAudioPlayer'
import WaveformVisualizer from '@/components/WaveformVisualizer'
import useAppStore from '@/store/useAppStore'
import { sanitizeBeliefNode } from '@/utils/sanitize'

const MAX_BELIEFS = 5

export default function InterviewPage() {
  const router = useRouter()
  const { setUser, setSessionId, addBelief, beliefs, addTranscriptEntry, clearTranscript, transcript, setIsInterviewing } = useAppStore()

  const [user, setLocalUser] = useState(null)
  const [sessionId, setLocalSessionId] = useState(null)
  const [agentStatus, setAgentStatus] = useState('connecting') // connecting | active | speaking | listening | ending
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [micError, setMicError] = useState(null)
  const [transcriptScrollRef] = useState(() => ({ current: null }))

  const liveServiceRef = useRef(null)
  const sessionCreatedRef = useRef(false)

  const { isCapturing, hasPermission, error: micErr, start: startMic, stop: stopMic, getAnalyser: getMicAnalyser } = useMicrophone()
  const { playChunk, stop: stopPlayer, getAnalyser: getPlayerAnalyser } = useAudioPlayer()

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

    const init = async () => {
      clearTranscript()

      // Create Firestore session
      const sid = await createSession(user.uid)
      setLocalSessionId(sid)
      setSessionId(sid)
      setIsInterviewing(true)

      // Initialize Gemini Live
      const svc = new GeminiLiveService()
      svc.init(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

      svc.onAudioChunk = (chunk) => {
        playChunk(chunk)
        setAgentStatus('speaking')
      }

      svc.onTranscript = (entry) => {
        addTranscriptEntry(entry)
        if (entry.role === 'assistant') setAgentStatus('listening')
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
        liveServiceRef.current = svc
        setAgentStatus('active')

        // Start capturing mic and sending audio
        await startMic((pcm16) => {
          svc.sendAudio(pcm16)
        })
      } catch (err) {
        console.error('[Interview] Failed to start:', err)
        setMicError(err.message)
        setAgentStatus('active') // Still show UI
      }
    }

    init()
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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#818CF8]/8 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-12 border-b border-white/5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-center size-8 sm:size-10 rounded-xl bg-white/5 border border-white/10">
            <span className="material-symbols-outlined text-[#818CF8] text-[20px] sm:text-[24px]">psychology</span>
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white hidden sm:block">MindRoots</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Belief counter */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 rounded-full border border-white/10">
            <span className="text-xs sm:text-sm font-medium text-slate-300">
              🔥 <span className="hidden sm:inline">{beliefs.length} of {MAX_BELIEFS} beliefs excavated</span>
              <span className="inline sm:hidden">{beliefs.length}/{MAX_BELIEFS}</span>
            </span>
          </div>

          {/* End Session */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs sm:text-sm font-semibold text-white/60 hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">call_end</span>
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Waveform */}
          <WaveformVisualizer
            analyser={currentAnalyser}
            isActive={isCapturing || agentStatus === 'speaking'}
            color={agentStatus === 'speaking' ? '#818CF8' : '#ffffff'}
          />

          {/* Status text */}
          <div className="text-center">
            {micError && (
              <p className="text-amber-400 text-sm mb-2">
                ⚠ Microphone unavailable — type your responses below
              </p>
            )}
            <p className="font-display text-2xl md:text-3xl font-medium text-white max-w-2xl leading-relaxed">
              {statusLabels[agentStatus] || 'Ready'}
            </p>
            <p className="text-slate-500 mt-2 text-sm">
              {agentStatus === 'connecting' ? 'Establishing secure session...' : 'MindRoots is analyzing the patterns in your narrative.'}
            </p>
          </div>

          {/* Status indicator dot */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              agentStatus === 'speaking' ? 'bg-[#818CF8] animate-pulse' :
              agentStatus === 'listening' ? 'bg-green-400 animate-pulse' :
              agentStatus === 'active' ? 'bg-white/40' :
              'bg-white/20'
            }`} />
            <span className="text-xs text-slate-500 uppercase tracking-widest">
              {agentStatus === 'speaking' ? 'Agent speaking' : agentStatus === 'listening' ? 'Listening' : 'Ready'}
            </span>
          </div>
        </div>
      </main>

      {/* Transcript Panel */}
      <section className="relative z-10 px-6 lg:px-8 max-w-5xl mx-auto w-full mb-4">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors mb-3"
        >
          <span className="material-symbols-outlined text-base">
            {showTranscript ? 'expand_less' : 'expand_more'}
          </span>
          {showTranscript ? 'Hide transcript' : 'Show transcript'}
        </button>

        {showTranscript && (
          <div
            ref={(el) => { transcriptScrollRef.current = el }}
            className="frosted-glass rounded-xl p-4 sm:p-6 max-h-[200px] sm:max-h-[280px] overflow-y-auto flex flex-col gap-4 sm:gap-6"
          >
            {transcript.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Conversation will appear here...</p>
            ) : (
              transcript.map((entry, i) => (
                <div key={i} className={`flex gap-4 max-w-3xl ${entry.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 size-8 rounded-full flex items-center justify-center border ${
                    entry.role === 'assistant'
                      ? 'bg-[#818CF8]/20 border-[#818CF8]/30'
                      : 'bg-white/10 border-white/20'
                  }`}>
                    <span className="material-symbols-outlined text-[16px] text-[#818CF8]">
                      {entry.role === 'assistant' ? 'smart_toy' : 'person'}
                    </span>
                  </div>
                  <div className={`flex flex-col gap-1 ${entry.role === 'user' ? 'items-end' : ''}`}>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#818CF8]">
                      {entry.role === 'assistant' ? 'Agent' : 'You'}
                    </span>
                    <p className={`text-[15px] leading-relaxed ${entry.role === 'user' ? 'text-right text-white' : 'text-slate-200'}`}>
                      {entry.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Footer mic controls */}
      <footer className="relative z-10 flex items-center justify-center pb-8 px-6 gap-4">
        <button
          onClick={() => isCapturing ? stopMic() : startMic((pcm16) => liveServiceRef.current?.sendAudio(pcm16))}
          className={`size-14 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg ${
            isCapturing ? 'bg-white text-black shadow-white/20' : 'bg-white/10 border border-white/20 text-white'
          }`}
        >
          <span className="material-symbols-outlined">{isCapturing ? 'mic' : 'mic_off'}</span>
        </button>
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
