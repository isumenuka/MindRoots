'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged, signOut, getSessions } from '@/services/FirebaseService'
import useAppStore from '@/store/useAppStore'
import AppSidebar from '@/components/AppSidebar'

export default function HistoryPage() {
  const router = useRouter()
  const storeSetUser = useAppStore(s => s.setUser)
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

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

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      storeSetUser(null)
      router.push('/')
    } catch (e) {
      console.error(e)
      setSigningOut(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0A] text-slate-100 font-sans relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-[#818CF8]/4 blur-[120px] rounded-full" />
      </div>

      {/* Shared sidebar */}
      <AppSidebar user={user} onSignOut={handleSignOut} signingOut={signingOut} />

      {/* Mobile top bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 h-14 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-xl">
        <span className="font-display font-bold text-white text-lg">History</span>
        <button onClick={() => router.push('/settings')} className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
          )}
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative z-10 pt-14 md:pt-0">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 md:py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Session History</h1>
              <p className="text-slate-500 mt-1">A reflective gallery of your past mental excavations.</p>
            </div>
            <button
              onClick={() => router.push('/interview')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#818CF8] text-white rounded-xl font-bold text-sm hover:bg-[#818CF8]/90 transition-colors shadow-lg shadow-[#818CF8]/20 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Session
            </button>
          </div>

          {/* Session grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-[#818CF8] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold">Loading archives…</p>
            </div>
          ) : sessions.length === 0 ? (
            <div
              onClick={() => router.push('/interview')}
              className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-12 group hover:border-[#818CF8]/30 transition-all cursor-pointer min-h-[260px]"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-5 group-hover:bg-[#818CF8]/10 transition-colors">
                <span className="material-symbols-outlined text-slate-500 group-hover:text-[#818CF8] transition-colors">history_edu</span>
              </div>
              <p className="text-slate-500 text-sm font-medium text-center">No sessions yet. Start your first excavation.</p>
              <span className="mt-4 flex items-center gap-1 text-xs text-[#818CF8] font-semibold uppercase tracking-widest">
                Begin
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessions.map((s) => {
                const date = s.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Unknown'
                return (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/session/${s.id}?uid=${user.uid}`)}
                    className="group bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-[#818CF8]/40 hover:bg-white/[0.05] transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    {/* Card accent bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#818CF8] to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div className="p-6 flex flex-col gap-4 grow">
                      {s.overall_emotional_tone && (
                        <span className="self-start px-2.5 py-1 bg-[#818CF8]/15 border border-[#818CF8]/30 text-[#818CF8] text-[10px] font-bold uppercase tracking-wider rounded-full">
                          {s.overall_emotional_tone}
                        </span>
                      )}
                      <h3 className="text-slate-100 text-lg font-display font-bold group-hover:text-[#818CF8] transition-colors line-clamp-2 leading-snug">
                        {s.dominant_theme || 'Belief Excavation Session'}
                      </h3>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5 text-xs text-slate-500">
                        <span>{date}</span>
                        <span>{s.total_beliefs || '?'} beliefs</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
