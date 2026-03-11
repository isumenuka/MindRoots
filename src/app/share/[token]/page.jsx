'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getShareData, getSession, getBeliefs, db, doc, getDoc } from '@/services/FirebaseService'
import BeliefCard from '@/components/BeliefCard'
import AudioPlayer from '@/components/AudioPlayer'

export default function SharePage({ params }) {
  const router = useRouter()
  const token = params.token
  const [session, setSession] = useState(null)
  const [beliefs, setBeliefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const shareData = await getShareData(token)
        if (!shareData) { setNotFound(true); setLoading(false); return }
        const { uid, sessionId } = shareData

        const ses = await getSession(uid, sessionId)
        setSession(ses)

        const bels = await getBeliefs(uid, sessionId)
        const sorted = bels.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        setBeliefs(sorted)
      } catch (e) {
        console.error(e)
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
          <p className="text-text-muted font-display tracking-widest uppercase text-sm">Loading shared session</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center text-center px-6">
        <div>
          <span className="material-symbols-outlined text-6xl text-text-muted mb-6 block">link_off</span>
          <h2 className="font-display text-3xl font-bold text-slate-100 mb-3">Link Expired or Invalid</h2>
          <p className="text-text-muted mb-8 max-w-md mx-auto">This shared session link may have expired, been revoked, or deleted by the owner.</p>
          <button onClick={() => router.push('/')} className="px-8 py-3 bg-primary text-background-dark rounded-xl font-display font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20">Go to MindRoots</button>
        </div>
      </div>
    )
  }

  const dominantTheme = session?.dominant_theme || 'Belief Origin Tree'
  const sessionDate = session?.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'Session'

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-text-muted pb-24">
      {/* Shared badge header */}
      <header className="h-20 flex items-center justify-between px-6 lg:px-12 border-b border-border-muted/50 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-background-dark text-[18px] sm:text-lg font-bold">psychology_alt</span>
          </div>
          <h1 className="font-display text-lg sm:text-xl font-bold text-slate-100 hidden sm:block tracking-tight">MindRoots</h1>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-border-muted">
          <span className="material-symbols-outlined text-accent text-[16px]">visibility</span>
          <span className="text-xs text-text-muted font-display font-medium tracking-wide">READ-ONLY VIEW</span>
        </div>
        
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 text-xs sm:text-sm font-display font-bold bg-white text-background-dark rounded-xl hover:bg-slate-200 transition-all shadow-lg shadow-white/10"
        >
          Create my own
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Session hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-display font-bold text-primary uppercase tracking-widest">Shared Session</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-100 mb-4 tracking-tight">{dominantTheme}</h2>
          <p className="text-text-muted font-light flex justify-center items-center gap-3">
            <span>{sessionDate}</span>
            <span className="w-1 h-1 rounded-full bg-border-muted" />
            <span>{beliefs.length} Core Belief{beliefs.length !== 1 ? 's' : ''}</span>
          </p>
        </div>

        {/* Audio player */}
        {session?.narration_url && (
            <div className="mb-12">
                <AudioPlayer src={session.narration_url} title="Session Narration" />
            </div>
        )}

        {/* Belief Cards */}
        <div className="space-y-12">
          {beliefs.map((node, i) => (
            <BeliefCard key={i} node={node} index={i} />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-24 pt-12 border-t border-border-muted text-center relative overflow-hidden rounded-3xl p-12 bg-white/[0.02]">
           <div className="absolute inset-0 border border-white/5 rounded-3xl mix-blend-overlay"></div>
            <div className="relative z-10 max-w-xl mx-auto space-y-6">
                <span className="material-symbols-outlined text-4xl text-accent/50 mb-2">auto_awesome</span>
                <p className="text-slate-300 text-lg font-light italic font-display">
                "The first step to uprooting a belief is to see where it was planted."
                </p>
                <button
                onClick={() => router.push('/')}
                className="mt-6 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-background-dark font-display font-bold hover:scale-105 transition-transform shadow-xl shadow-primary/20 text-lg"
                >
                Begin My Own Excavation
                </button>
            </div>
        </div>
      </main>
    </div>
  )
}
