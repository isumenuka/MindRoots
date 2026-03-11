'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged, getSessions } from '@/services/FirebaseService'

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/'); return }
      setUser(u)
      try {
        const ses = await getSessions(u.uid)
        setSessions(ses)
      } catch (e) { console.error(e) }
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-[#818CF8]/4 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-5 lg:px-16">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 bg-[#818CF8] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px] sm:text-lg">psychology</span>
            </div>
            <h1 className="font-display text-lg sm:text-xl font-bold text-white group-hover:text-[#818CF8] transition-colors hidden sm:block">MindRoots</h1>
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => router.push('/interview')} className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-black rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-all">
            <span className="material-symbols-outlined text-[16px] sm:text-lg">add</span>
            <span className="hidden sm:inline">New Excavation</span>
            <span className="inline sm:hidden">New</span>
          </button>
          <button onClick={() => router.push('/settings')} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">settings</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-12">
        <div className="mb-10">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-2">Your Excavations</h2>
          <p className="text-slate-500">A history of every belief archaeology session.</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#818CF8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <span className="material-symbols-outlined text-5xl text-slate-700 mb-4 block">history</span>
            <p className="text-slate-400 font-display text-xl font-semibold mb-2">No sessions yet</p>
            <p className="text-slate-600 text-sm mb-6">Start your first belief excavation to see your history here.</p>
            <button onClick={() => router.push('/interview')} className="px-6 py-3 bg-[#818CF8] text-white rounded-xl font-semibold hover:bg-[#818CF8]/80 transition-all">
              Begin Excavation
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => {
              const date = s.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Unknown date'
              return (
                <div
                  key={s.id}
                  onClick={() => router.push(`/session/${s.id}?uid=${user.uid}`)}
                  className="glass-card rounded-2xl p-6 cursor-pointer hover:border-[#818CF8]/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#818CF8]/15 border border-[#818CF8]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#818CF8]">account_tree</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{date}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-2 group-hover:text-[#818CF8] transition-colors line-clamp-2">
                    {s.dominant_theme || 'Belief Excavation Session'}
                  </h3>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-[14px]">psychology_alt</span>
                      {s.total_beliefs || '?'} beliefs
                    </span>
                    {s.overall_emotional_tone && (
                      <span className="text-xs text-slate-600 capitalize px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        {s.overall_emotional_tone}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center text-xs text-[#818CF8] font-semibold gap-1 group-hover:gap-2 transition-all">
                    View map
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
