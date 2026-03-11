'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, onAuthStateChanged } from '@/services/FirebaseService'
import useFirestoreListener from '@/hooks/useFirestoreListener'
import ProcessingStages from '@/components/ProcessingStages'

const STAGE_MESSAGES = {
  interviewing: 'Securing your excavation results...',
  structuring: 'Brushing away layers...',
  structuring_complete: 'Hitting bedrock...',
  generating_images: 'Painting your memories...',
  generating_audio: 'Recording your story...',
  generating_pdf: 'Drawing your map...',
  complete: 'Your map is ready.',
}

const STAGE_PROGRESS = {
  interviewing: 15,
  structuring: 30,
  structuring_complete: 50,
  generating_images: 65,
  generating_audio: 80,
  generating_pdf: 92,
  complete: 100,
}

export default function ProcessingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const uid = searchParams.get('uid')

  const [user, setUser] = useState(null)
  const docPath = uid && sessionId ? `users/${uid}/sessions/${sessionId}` : null
  const { data: session, loading } = useFirestoreListener(docPath)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u && !uid) { router.push('/'); return }
      setUser(u)
    })
    return () => unsub()
  }, [router, uid])

  // Auto-navigate when complete
  useEffect(() => {
    if (session?.status === 'complete' && sessionId && uid) {
      setTimeout(() => {
        router.push(`/session/${sessionId}?uid=${uid}`)
      }, 2000)
    }
  }, [session?.status, sessionId, uid, router])

  const status = session?.status || 'structuring'
  const progress = STAGE_PROGRESS[status] || 20
  const message = STAGE_MESSAGES[status] || 'Processing...'

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col relative">
      {/* Ambient backgrounds */}
      <div className="fixed inset-0 ambient-gradient pointer-events-none" />
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#818CF8]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#818CF8]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-[15%] w-px h-32 bg-gradient-to-b from-transparent via-[#818CF8]/30 to-transparent" />
      <div className="absolute bottom-[25%] left-[12%] w-px h-24 bg-gradient-to-b from-transparent via-[#818CF8]/20 to-transparent" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-[#818CF8] rounded-lg">
            <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
          </div>
          <h1 className="font-display text-[#818CF8] text-xl font-semibold tracking-tight">MindRoots</h1>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl text-white font-light mb-4 tracking-tight">
              Excavating your <span className="italic text-[#818CF8]">inner world</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-md mx-auto">
              Our AI agents are weaving your belief archaeology through three sequential stages.
            </p>
          </div>

          {/* Stages */}
          <ProcessingStages sessionStatus={status} />

          {/* Progress bar */}
          <div className="mt-16 pt-8 border-t border-white/5">
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-[#818CF8] font-semibold mb-1 block">Status</span>
                <span className="text-white font-medium">{message}</span>
              </div>
              <span className="text-white font-display text-2xl font-light">{progress}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#818CF8] rounded-full shadow-[0_0_10px_rgba(129,140,248,0.5)] transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Completion CTA */}
          {status === 'complete' && sessionId && uid && (
            <div className="mt-10 text-center animate-pulse">
              <p className="text-[#818CF8] font-semibold mb-4">✨ Your map is ready</p>
              <button
                onClick={() => router.push(`/session/${sessionId}?uid=${uid}`)}
                className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-white/10"
              >
                View Your Belief Origin Tree
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 p-8 text-center text-[10px] uppercase tracking-[0.4em] text-white/10">
        System Identity: MindRoots-Core-V2 // Session: Archae-{sessionId?.slice(-6) || '---'}
      </footer>
    </div>
  )
}
