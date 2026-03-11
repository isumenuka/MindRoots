'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, onAuthStateChanged } from '@/services/FirebaseService'
import useFirestoreListener from '@/hooks/useFirestoreListener'
import AppLogo from '@/components/AppLogo'

/* ─── Stage config ──────────────────────────────────────────────────────────── */
const STAGES = [
  {
    icon: 'mic',
    title: 'Belief Excavation',
    desc: 'Unearthing the roots of your beliefs',
    statuses: ['interviewing', 'structuring'],
  },
  {
    icon: 'account_tree',
    title: 'Structuring Your Map',
    desc: 'Building your Belief Origin Tree',
    statuses: ['structuring_complete', 'generating_images'],
  },
  {
    icon: 'auto_awesome',
    title: 'Generating Illustrations',
    desc: 'Painting the memories behind each root',
    statuses: ['generating_audio'],
  },
  {
    icon: 'record_voice_over',
    title: 'Recording Your Story',
    desc: 'Narrating the arc of your inner world',
    statuses: ['generating_pdf'],
  },
  {
    icon: 'auto_stories',
    title: 'Composing Your Report',
    desc: 'Finalising your Belief Origin Tree',
    statuses: ['complete'],
  },
]

const STATUS_ORDER = [
  'interviewing',
  'structuring',
  'structuring_complete',
  'generating_images',
  'generating_audio',
  'generating_pdf',
  'complete',
]

const STAGE_PROGRESS = {
  interviewing: 15,
  structuring: 30,
  structuring_complete: 48,
  generating_images: 62,
  generating_audio: 76,
  generating_pdf: 90,
  complete: 100,
}

const STATUS_LABEL = {
  interviewing: 'Securing your excavation results…',
  structuring: 'Brushing away the layers…',
  structuring_complete: 'Hitting bedrock…',
  generating_images: 'Painting your memories…',
  generating_audio: 'Recording your story…',
  generating_pdf: 'Drawing your map…',
  complete: 'Your map is ready.',
}

function stageState(stageIdx, currentStatusIdx) {
  // Figure out the order index range this stage occupies
  const stage = STAGES[stageIdx]
  const stageIdxes = stage.statuses.map(s => STATUS_ORDER.indexOf(s))
  const minIdx = Math.min(...stageIdxes)

  if (currentStatusIdx > Math.max(...stageIdxes)) return 'done'
  if (currentStatusIdx >= minIdx) return 'active'
  return 'pending'
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
function ProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const uid = searchParams.get('uid')

  const [user, setUser] = useState(null)
  const docPath = uid && sessionId ? `users/${uid}/sessions/${sessionId}` : null
  const { data: session } = useFirestoreListener(docPath)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u && !uid) { router.push('/'); return }
      setUser(u)
    })
    return () => unsub()
  }, [router, uid])

  // Auto-navigate on complete
  useEffect(() => {
    if (session?.status === 'complete' && sessionId && uid) {
      setTimeout(() => router.push(`/session/${sessionId}?uid=${uid}`), 2000)
    }
  }, [session?.status, sessionId, uid, router])

  const status = session?.status || 'structuring'
  const progress = STAGE_PROGRESS[status] || 20
  const statusLabel = STATUS_LABEL[status] || 'Processing…'
  const currentStatusIdx = STATUS_ORDER.indexOf(status)

  // Animate progress from 0 on mount / change
  const [displayProgress, setDisplayProgress] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDisplayProgress(progress), 120)
    return () => clearTimeout(t)
  }, [progress])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden font-inter">

      {/* Ambient glows — same as landing page */}
      <div className="fixed inset-0 hero-gradient -z-10 pointer-events-none" />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#818CF8]/4 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Nav — same pattern as landing */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <AppLogo />
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/history')}
              className="text-slate-500 hover:text-white transition-colors"
              title="View history"
            >
              <span className="material-symbols-outlined">history</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-slate-500 hover:text-white transition-colors"
              title="Home"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-12">
        <div className="w-full max-w-2xl">

          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20 text-[#818CF8] text-[10px] font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">cognition</span>
              AI Processing In Progress
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
              Excavating your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#818CF8] to-[#a78bfa] italic font-bold">
                inner world
              </span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto leading-relaxed">
              Our AI agents are weaving your belief archaeology.
              This may take a moment.
            </p>
          </div>

          {/* Stage cards */}
          <div className="glass-card rounded-2xl border border-white/10 p-6 md:p-8 mb-8 space-y-0">
            {STAGES.map((stage, i) => {
              const state = stageState(i, currentStatusIdx)
              const isDone = state === 'done'
              const isActive = state === 'active'

              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 ${i < STAGES.length - 1 ? 'pb-6 mb-6 border-b border-white/5' : ''} transition-all duration-500`}
                >
                  {/* Icon bubble */}
                  <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    isDone
                      ? 'bg-[#818CF8]/15 border border-[#818CF8]/30'
                      : isActive
                      ? 'bg-white border-2 border-white shadow-[0_0_24px_rgba(255,255,255,0.2)]'
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    {isDone ? (
                      <span className="material-symbols-outlined text-[#818CF8] text-xl">check</span>
                    ) : isActive ? (
                      <span
                        className="material-symbols-outlined text-[#0A0A0A] text-xl animate-spin"
                        style={{ animationDuration: '1.4s' }}
                      >progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-white/20 text-xl">{stage.icon}</span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-display font-semibold text-sm leading-snug transition-colors duration-300 ${
                      isDone ? 'text-white' : isActive ? 'text-white' : 'text-white/25'
                    }`}>
                      {stage.title}
                    </p>
                    <p className={`text-xs mt-0.5 transition-colors duration-300 ${
                      isDone ? 'text-slate-500' : isActive ? 'text-[#818CF8]' : 'text-white/15'
                    }`}>
                      {isDone ? '✓ Complete' : isActive ? stage.desc : stage.desc}
                    </p>
                  </div>

                  {/* Status badge */}
                  {isDone && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#818CF8] bg-[#818CF8]/10 border border-[#818CF8]/20 px-2 py-1 rounded-full">
                      Done
                    </span>
                  )}
                  {isActive && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-white bg-white/10 border border-white/20 px-2 py-1 rounded-full">
                      Running
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress footer */}
          <div className="glass-card rounded-2xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#818CF8] font-bold mb-0.5">Status</p>
                <p className="text-white font-medium text-sm">{statusLabel}</p>
              </div>
              <span className="font-display text-2xl font-bold text-white tabular-nums">
                {displayProgress}%
              </span>
            </div>
            {/* Bar track */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#818CF8] to-[#a78bfa] shadow-[0_0_12px_rgba(129,140,248,0.6)] transition-all duration-1000 ease-out"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>

          {/* Completion CTA */}
          {status === 'complete' && sessionId && uid && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-[#818CF8] text-sm font-semibold mb-6">
                <span className="material-symbols-outlined text-xl">check_circle</span>
                Your Belief Origin Tree is ready
              </div>
              <div>
                <button
                  onClick={() => router.push(`/session/${sessionId}?uid=${uid}`)}
                  className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:scale-105 transition-transform shadow-xl shadow-white/10 flex items-center gap-2 mx-auto"
                >
                  View Your Map
                  <span className="material-symbols-outlined text-lg">arrow_outward</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#818CF8]/20 border-t-[#818CF8] rounded-full animate-spin" />
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  )
}
