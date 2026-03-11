'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged, db, collection, addDoc, serverTimestamp } from '@/services/FirebaseService'
import useAppStore from '@/store/useAppStore'
import AppLogo from '@/components/AppLogo'

import useMicrophone from '@/hooks/useMicrophone'
import useAudioPlayer from '@/hooks/useAudioPlayer'
import GeminiLiveService from '@/services/GeminiLiveService'

import { Waves, Mic, MicOff, Check, X, PencilLine, Send } from 'lucide-react'

// A simple local volume meter component
function VolumeMeter({ getAnalyser }) {
  const canvasRef = useRef(null)
  const reqRef = useRef(null)

  useEffect(() => {
    const minHeight = 4
    const maxBarHeight = 32
    
    const draw = () => {
      reqRef.current = requestAnimationFrame(draw)
      const analyser = getAnalyser()
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (!analyser) {
        ctx.fillStyle = '#10B981' // emerald-500
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          ctx.roundRect(i * 12 + 10, (maxBarHeight - minHeight) / 2, 8, minHeight, 4)
          ctx.fill()
        }
        return
      }

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyser.getByteFrequencyData(dataArray)

      const values = [
        dataArray[Math.floor(bufferLength * 0.1)],
        dataArray[Math.floor(bufferLength * 0.3)],
        dataArray[Math.floor(bufferLength * 0.5)]
      ]

      ctx.fillStyle = '#10B981'
      values.forEach((val, i) => {
        const p = val / 255
        const h = Math.max(minHeight, p * maxBarHeight)
        const y = (maxBarHeight - h) / 2
        ctx.beginPath()
        ctx.roundRect(i * 12 + 10, y, 8, h, 4)
        ctx.fill()
      })
    }
    
    draw()
    return () => cancelAnimationFrame(reqRef.current)
  }, [getAnalyser])

  return <canvas ref={canvasRef} width={60} height={32} className="opacity-90 transition-opacity" />
}

export default function InterviewPage() {
  const router = useRouter()
  const { setUser, setInterviewId } = useAppStore()
  const [user, setLocalUser] = useState(null)

  const [hasStarted, setHasStarted] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [errorObj, setError] = useState(null)
  
  const [showConversation, setShowConversation] = useState(false)
  const [messages, setMessages] = useState([]) // Format: { text, role, id }
  
  const [textInput, setTextInput] = useState("")

  const geminiRef = useRef(null)
  const messagesEndRef = useRef(null)

  const mic = useMicrophone()
  const audio = useAudioPlayer()

  // Scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push('/'); return }
      setLocalUser(u)
      setUser(u)
    })
    return () => unsub()
  }, [router, setUser])

  const startSession = async () => {
    try {
      setError(null)
      // 1. Initialize audio player (needs user gesture)
      await audio.init()

      // 2. Initialize and start connection to Python Proxy
      const service = new GeminiLiveService()
      geminiRef.current = service

      service.onAudioChunk = (chunk) => audio.playChunk(chunk)
      service.onTranscript = (msg) => {
        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role: msg.role, text: msg.text }])
      }
      service.onInterruption = () => audio.stopPlayback()
      service.onError = (e) => {
        console.error(e)
        setError(e)
        endSession()
      }
      service.onComplete = () => endSession(true)
      
      service.onBeliefFound = async (belief) => {
        try {
          // Log belief to Firestore
          const docRef = await addDoc(collection(db, 'interviews', user.uid, 'beliefs'), {
            createdAt: serverTimestamp(),
            domain: belief.domain || 'Unknown',
            belief: belief.belief,
            reasoning: belief.reasoning
          })
          setInterviewId(user.uid)
        } catch (e) {
          console.error("Firebase write error:", e)
        }
      }

      await service.startSession()
      
      // 3. Start microphone capture
      await mic.start((b64) => {
        service.sendAudio(b64)
      })

      // 4. Trigger the assistant to greet us
      service.triggerAgentStart()
      
      setHasStarted(true)
    } catch (err) {
      console.error(err)
      setError(err)
    }
  }

  const endSession = async (autoFinish = false) => {
    if (isFinishing) return
    setIsFinishing(true)
    
    mic.stop()
    audio.stop()
    
    if (geminiRef.current) {
        await geminiRef.current.endSession()
    }
    
    setHasStarted(false)
    router.push('/summary')
  }

  const toggleMic = () => {
    if (mic.isCapturing) {
      mic.stop()
      if (geminiRef.current) geminiRef.current.sendAudioStreamEnd()
    } else {
      mic.start((b64) => {
        if (geminiRef.current) geminiRef.current.sendAudio(b64)
      })
    }
  }

  const handleSendText = (e) => {
    e.preventDefault()
    if (!textInput.trim() || !geminiRef.current) return
    
    audio.stopPlayback() // Interrupt any current playback
    geminiRef.current.sendText(textInput)
    setTextInput("")
  }

  const handleToggleConversation = () => setShowConversation((prev) => !prev)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-inter">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]"></div>
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12 border-b border-white/5">
        <AppLogo />
        
        {hasStarted ? (
          <button
            onClick={() => endSession(false)}
            className="px-5 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold transition-all flex items-center gap-2"
          >
            <X size={16} /> End Interview
          </button>
        ) : (
          <button
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-semibold text-white/70 hover:text-white"
          >
              Back to Home
          </button>
        )}
      </header>

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
         {/* Main Video/Audio Area */}
         <div className={`flex-1 flex flex-col items-center justify-center p-6 transition-all duration-500 ${showConversation ? 'lg:w-1/2 opacity-0 lg:opacity-100 hidden lg:flex' : 'w-full'}`}>
           
           {errorObj && (
             <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 max-w-md text-center">
               <span className="font-semibold block mb-1">Connection Error</span>
               {errorObj.message || String(errorObj)}
             </div>
           )}

           {!hasStarted ? (
             <div className="max-w-xl text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-accent/10 flex items-center justify-center rounded-3xl mb-8 border border-accent/20">
                  <Waves className="w-10 h-10 text-accent" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-medium mb-4">Ready to start?</h1>
                <p className="text-slate-400 mb-10 text-lg">We'll explore your mind maps via voice. Make sure your microphone is ready.</p>
                <button
                  onClick={startSession}
                  className="px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium shadow-lg shadow-accent/20 transition-all active:scale-[0.98] text-lg"
                >
                  Start Interview
                </button>
             </div>
           ) : (
             <div className="flex flex-col items-center w-full max-w-lg">
                {/* Visualizer for Gemini Audio */}
                <div className="w-48 h-48 rounded-full border border-white/5 bg-[#111] flex items-center justify-center shadow-2xl relative mb-12">
                   {audio.isPlaying && (
                     <div className="absolute inset-[-20px] rounded-full border border-emerald-500/30 animate-ping"></div>
                   )}
                   <VolumeMeter getAnalyser={audio.getAnalyser} />
                </div>
                
                <h2 className="text-xl font-display font-medium text-white mb-2">Gemini is Listening</h2>
                <p className="text-slate-400 mb-12">Speak naturally. Say "I want to type" if you prefer text.</p>
                
                <div className="flex items-center gap-4 bg-[#111] p-2 rounded-2xl border border-white/5 shadow-xl">
                    <button
                      onClick={toggleMic}
                      className={`p-4 rounded-xl transition-all flex items-center justify-center ${mic.isCapturing ? 'bg-white text-black hover:bg-white/90' : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'}`}
                    >
                      {mic.isCapturing ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>
                    {!showConversation && (
                      <button
                        onClick={handleToggleConversation}
                        className="px-6 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-medium text-white/70 hover:text-white flex items-center gap-2"
                      >
                        <PencilLine size={20} /> Use Text Instead
                      </button>
                    )}
                </div>
             </div>
           )}
         </div>

         {/* Conversation Side Panel */}
         <div className={`transition-all duration-500 ease-in-out border-l border-white/5 bg-[#0D0D0D] flex flex-col
           ${showConversation ? 'w-full lg:w-[450px] translate-x-0' : 'w-0 translate-x-[100%] opacity-0 overflow-hidden'}`}>
           
           <div className="flex items-center justify-between p-6 border-b border-white/5">
             <h3 className="font-semibold text-lg font-display">Conversation</h3>
             <button onClick={handleToggleConversation} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
               <X size={20} />
             </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
             {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                 <Waves className="w-8 h-8 mb-3 opacity-20" />
                 <p>Conversation history will appear here.</p>
               </div>
             ) : (
               messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] rounded-2xl p-4 text-[15px] leading-relaxed ${
                     msg.role === 'user' 
                       ? 'bg-accent/20 text-[#E0F2FE] border border-accent/30 rounded-br-sm' 
                       : 'bg-white/5 text-slate-300 border border-white/10 rounded-bl-sm'
                   }`}>
                     {msg.text}
                   </div>
                 </div>
               ))
             )}
             <div ref={messagesEndRef} />
           </div>
           
           <div className="p-4 border-t border-white/5 bg-[#0D0D0D]">
             <form onSubmit={handleSendText} className="relative flex items-center">
               <input 
                 type="text"
                 value={textInput}
                 onChange={(e) => setTextInput(e.target.value)}
                 placeholder="Type your response..."
                 className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-accent/50 text-sm transition-colors text-white placeholder-slate-500"
               />
               <button 
                 type="submit" 
                 disabled={!textInput.trim() || !hasStarted}
                 className="absolute right-2 p-2 text-accent disabled:text-slate-600 hover:text-accent-hover transition-colors"
               >
                 <Send size={18} />
               </button>
             </form>
           </div>
         </div>
      </main>
    </div>
  )
}
