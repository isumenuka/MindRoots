'use client'
import { use, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, onAuthStateChanged, getSession, getBeliefs, generateShareToken } from '@/services/FirebaseService'
import BeliefCard from '@/components/BeliefCard'
import AudioPlayer from '@/components/AudioPlayer'
import AppLogo from '@/components/AppLogo'

export default function SessionPage({ params }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const uidParam = searchParams.get('uid')
  const { sessionId } = use(params)

  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [beliefs, setBeliefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [shareUrl, setShareUrl] = useState(null)
  const [copying, setCopying] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u && !uidParam) { router.push('/'); return }
      setUser(u)
    })
    return () => unsub()
  }, [router, uidParam])

  useEffect(() => {
    const uid = user?.uid || uidParam
    if (!uid || !sessionId) return

    const load = async () => {
      try {
        const ses = await getSession(uid, sessionId)
        setSession(ses)
        const bels = await getBeliefs(uid, sessionId)
        const sorted = bels.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        setBeliefs(sorted)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [user, uidParam, sessionId])

  const handleShare = async () => {
    const uid = user?.uid || uidParam
    if (!uid) return
    try {
      const token = await generateShareToken(uid, sessionId)
      const url = `${window.location.origin}/share/${token}`
      setShareUrl(url)
      await navigator.clipboard.writeText(url)
      setCopying(true)
      setTimeout(() => setCopying(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDownloadPdf = async () => {
    const uid = user?.uid || uidParam
    if (!uid) return
    setDownloadingPdf(true)
    try {
      // Load the belief tree data for PDF
      const beliefTree = { session_summary: session, belief_nodes: beliefs }
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, sessionId, beliefTree }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mindroots-belief-origin-tree-${sessionId.slice(0, 8)}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error(e)
    }
    setDownloadingPdf(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient Background Effect */}
        <div className="fixed inset-0 ambient-gradient pointer-events-none"></div>
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full"></div>
        <div className="text-center relative z-10">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted text-sm uppercase tracking-widest font-semibold">Loading your belief map...</p>
        </div>
      </div>
    )
  }

  const dominantTheme = session?.dominant_theme || beliefs[0]?.belief || 'Your Belief Origins'
  const sessionDate = session?.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'Session'

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 ambient-gradient pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-4 lg:px-40">
        <AppLogo />
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/history')}
            className="flex items-center justify-center rounded-xl h-10 w-10 bg-surface text-slate-100 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[20px]">history</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center justify-center rounded-xl h-10 w-10 bg-surface text-slate-100 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[20px]">settings</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center">
        <div className="w-full max-w-[960px] px-6 lg:px-10 py-8">
          {/* Hero */}
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent uppercase tracking-wider">Analysis Complete</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-slate-100 mb-3 tracking-tight">
              {dominantTheme}
            </h1>
            <p className="text-slate-400 text-base lg:text-lg">
              {sessionDate}
              <span className="mx-2 opacity-30">•</span>
              {beliefs.length} Core Belief{beliefs.length !== 1 ? 's' : ''} Identified
            </p>
          </div>

          {/* Sticky action bar */}
          <div className="sticky top-4 z-50 mb-12">
            <div className="bg-[#0f1117] border border-[#818CF8]/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_30px_rgba(129,140,248,0.08)] backdrop-blur-xl">
              {/* Audio Player */}
              <div className="flex items-center gap-4 flex-1 min-w-[280px]">
              <AudioPlayer
                  src={session?.narration_url || null}
                  narrationText={session?.narration_text || null}
                  title="Session Audio"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-white/10 text-sm font-bold text-slate-100 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>{downloadingPdf ? 'Generating...' : 'PDF'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-white/10 text-sm font-bold text-slate-100 hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">{copying ? 'check' : 'share'}</span>
                  <span>{copying ? 'Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Share URL display */}
          {shareUrl && (
            <div className="mb-8 p-4 rounded-xl border border-accent/30 bg-accent/5 flex items-center gap-3">
              <span className="material-symbols-outlined text-accent text-sm">link</span>
              <p className="text-xs text-slate-400 flex-1 font-mono truncate">{shareUrl}</p>
              <span className="text-xs text-accent">Copied!</span>
            </div>
          )}

          {/* Belief Cards */}
          <div className="space-y-8 relative">
            {/* Connecting line */}
            <div className="absolute left-0 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent/50 via-accent/10 to-transparent hidden lg:block -translate-x-1/2" />

            {beliefs.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-500">No beliefs found in this session.</p>
              </div>
            ) : (
              beliefs.map((node, i) => (
                <BeliefCard key={node.id || i} node={node} index={i} />
              ))
            )}
          </div>

          {/* Session summary footer */}
          {session?.overall_emotional_tone && (
            <div className="mt-12 p-6 lg:p-8 rounded-2xl border border-white/5 bg-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h3 className="font-display text-lg font-bold text-slate-100 mb-3 relative z-10">Session Summary</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm relative z-10">
                <div>
                  <p className="text-xs text-accent uppercase tracking-widest mb-1">Dominant Theme</p>
                  <p className="text-slate-300 font-body">{session.dominant_theme}</p>
                </div>
                <div>
                  <p className="text-xs text-accent uppercase tracking-widest mb-1">Emotional Tone</p>
                  <p className="text-slate-300 font-body capitalize">{session.overall_emotional_tone}</p>
                </div>
                <div>
                  <p className="text-xs text-accent uppercase tracking-widest mb-1">Total Cost</p>
                  <p className="text-slate-300 font-body">{session.estimated_total_cost || 'Significant'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-16 text-center">
            <div className="max-w-xl mx-auto space-y-6">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="text-slate-500 font-body text-sm italic">
                "The first step to uprooting a belief is to see where it was planted."
              </p>
              <button
                onClick={() => router.push('/interview')}
                className="px-8 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/80 transition-all shadow-[0_0_15px_rgba(129,140,248,0.3)] hover:shadow-[0_0_25px_rgba(129,140,248,0.5)] transform hover:-translate-y-1"
              >
                Begin Another Excavation
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-10 border-t border-white/5 text-center text-slate-600 text-xs relative z-10 mt-auto">
        © 2026 MindRoots Introspective Systems. All rights reserved.
      </footer>
    </div>
  )
}
