'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, onAuthStateChanged } from '@/services/FirebaseService'
import useFirestoreListener from '@/hooks/useFirestoreListener'
import ProcessingStages from '@/components/ProcessingStages'
import AppLogo from '@/components/AppLogo'

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

function ProcessingContent() {
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient Background Effect */}
      <div className="fixed inset-0 ambient-gradient pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full"></div>
      {/* Background Decorative Elements */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[20%] right-[15%] w-px h-32 bg-gradient-to-b from-transparent via-accent to-transparent"></div>
        <div className="absolute bottom-[20%] left-[15%] w-px h-32 bg-gradient-to-b from-transparent via-accent to-transparent"></div>
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <AppLogo />
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/history')}
            className="text-slate-400 hover:text-white transition-colors"
            title="View history"
          >
            <span className="material-symbols-outlined">history</span>
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-primary font-light mb-4 tracking-tight">
              Excavating your <span className="italic">inner world</span>
            </h2>
            <p className="text-muted text-lg max-w-md mx-auto">
              Our AI agents are weaving your belief archaeology. This may take a moment.
            </p>
          </div>

          {/* Stages */}
          <ProcessingStages sessionStatus={status} />

          {/* Footer Progress */}
          <div className="mt-20 pt-8 border-t border-white/5">
            <div className="flex justify-between items-end mb-3">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-1">Status</span>
                <span className="text-primary font-medium">{message}</span>
              </div>
              <span className="text-primary font-display text-2xl font-light">{progress}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent shadow-[0_0_10px_rgba(129,140,248,0.5)] transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Completion CTA */}
          {status === 'complete' && sessionId && uid && (
            <div className="mt-10 text-center animate-pulse">
              <p className="text-accent font-semibold mb-4 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Your map is ready
              </p>
              <button
                onClick={() => router.push(`/session/${sessionId}?uid=${uid}`)}
                className="px-8 py-4 bg-primary text-background-dark font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-white/10"
              >
                View Your Belief Origin Tree
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Aesthetic Footer */}
      <footer className="relative z-10 p-8 text-center text-[10px] uppercase tracking-[0.4em] text-dim/40">
        System Identity: Roots-Core-V2 // Session: Archae-{sessionId?.slice(-6) || '---'}
      </footer>
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0A0A0A]">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  )
}
