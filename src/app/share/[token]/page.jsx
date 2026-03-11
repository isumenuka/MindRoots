'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#818CF8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading shared session...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-center px-6">
        <div>
          <span className="material-symbols-outlined text-5xl text-slate-700 mb-4 block">link_off</span>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Link not found</h2>
          <p className="text-slate-500 mb-6">This shared session link may have expired or been deleted.</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-[#818CF8] text-white rounded-xl font-semibold">Go to MindRoots</button>
        </div>
      </div>
    )
  }

  const dominantTheme = session?.dominant_theme || 'Belief Origin Tree'
  const sessionDate = session?.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'Session'

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[50%] h-[30%] bg-[#818CF8]/4 blur-[120px]" />
      </div>

      {/* Shared badge header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-4 lg:px-16">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#818CF8] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">psychology</span>
          </div>
          <h1 className="font-display text-xl font-bold text-white">MindRoots</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="material-symbols-outlined text-slate-400 text-[14px]">visibility</span>
          <span className="text-xs text-slate-500 font-medium">Read-only shared view</span>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-sm font-semibold bg-white text-black rounded-xl hover:bg-slate-100 transition-all"
        >
          Create my own
        </button>
      </header>

      <main className="relative z-10 max-w-[960px] mx-auto px-6 lg:px-10 py-8">
        {/* Session hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8] animate-pulse" />
            <span className="text-xs font-medium text-[#818CF8] uppercase tracking-wider">Shared Session</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-2">{dominantTheme}</h2>
          <p className="text-slate-500">
            {sessionDate}
            <span className="mx-2 opacity-30">•</span>
            {beliefs.length} Core Belief{beliefs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Audio player */}
        {session?.narration_url && (
          <div className="mb-8 glass-card rounded-xl p-3 flex items-center gap-4">
            <AudioPlayer src={session.narration_url} title="Session Narration" />
          </div>
        )}

        {/* Belief Cards */}
        <div className="space-y-8">
          {beliefs.map((node, i) => (
            <BeliefCard key={i} node={node} index={i} />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <p className="text-slate-500 text-sm italic">
              "The first step to uprooting a belief is to see where it was planted."
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 rounded-xl bg-[#818CF8] text-white font-bold hover:bg-[#818CF8]/80 transition-all shadow-lg shadow-[#818CF8]/20"
            >
              Begin My Own Excavation
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
