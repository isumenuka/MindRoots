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
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-dark">
      <div className="layout-container flex h-full grow flex-col">
        {/* Ambient Background Effect */}
        <div className="fixed inset-0 ambient-gradient pointer-events-none"></div>
        <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full"></div>
        
        {/* Top Navigation Bar */}
        <header className="relative z-10 flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 py-4 lg:px-10">
          <div className="flex items-center gap-4 text-primary cursor-pointer" onClick={() => router.push('/')}>
            <div className="flex items-center justify-center p-2 rounded-lg bg-accent/20 text-accent">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <h2 className="text-primary text-lg font-bold leading-tight tracking-tight font-display hidden sm:block">MindRoots</h2>
          </div>
          
          <div className="flex flex-1 justify-end gap-4 lg:gap-8 items-center">
            <div className="flex gap-2">
              <button onClick={() => router.push('/interview')} className="bg-primary text-background-dark px-4 sm:px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="hidden sm:inline">New Session</span>
                <span className="inline sm:hidden">New</span>
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 p-6 lg:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Content Header */}
            <div className="flex flex-col gap-1 mb-10">
              <h1 className="text-slate-100 text-3xl md:text-4xl font-black leading-tight tracking-tight font-display">Your Archives</h1>
              <p className="text-muted text-base lg:text-lg">A reflective gallery of your past mental landscapes.</p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted text-sm uppercase tracking-widest font-semibold">Loading archives...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div
                onClick={() => router.push('/interview')}
                className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-10 group hover:border-accent/30 transition-all cursor-pointer"
              >
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                  <span className="material-symbols-outlined text-muted group-hover:text-accent">history_edu</span>
                </div>
                <p className="text-muted text-sm font-medium text-center">Start a new reflective journey to grow your archive.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((s) => {
                  const date = s.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Unknown date'
                  
                  return (
                    <div
                      key={s.id}
                      onClick={() => router.push(`/session/${s.id}?uid=${user.uid}`)}
                      className="bg-card/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden group hover:border-accent/50 hover:shadow-[0_0_15px_rgba(129,140,248,0.15)] transition-all duration-300 cursor-pointer flex flex-col"
                    >
                      <div
                        className="h-32 sm:h-40 w-full bg-center bg-cover relative"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, rgba(10,10,10,0.2), rgba(10,10,10,0.8)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDT8nthmBSxAqqhJHmrb77-fhfOd5kERXw8a15LUiDwxBq370rTOw_75UfZrOS5Xd9vl-DmQkjKz0qTQeAQPOS1O07L7zSkc-iOULnVifM5Bus-3pKvMLqmpreu5VtMPG7lerRyGICzYxEd2mpoyrUbnpufNbRjrPzJySrPpXsLemL6zQTLhkUh55vN8YHKT13SmuMxAxv-X1t7DFgcHQJYg-ctdg7bGYj3Tu0PdKdnufvHBrF-_CPPj2t5JnIIWtg5LJa1csUpxsE')`
                        }}
                      >
                        {s.overall_emotional_tone && (
                          <div className="absolute top-4 right-4 bg-background-dark/80 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                            <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">
                              {s.overall_emotional_tone}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6 flex flex-col gap-4 grow">
                        <h3 className="text-slate-100 text-xl font-bold font-display group-hover:text-accent transition-colors line-clamp-2">
                          {s.dominant_theme || 'Belief Excavation Session'}
                        </h3>
                        
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <div className="flex flex-col">
                            <span className="text-muted text-xs uppercase tracking-widest font-semibold">Session Date</span>
                            <span className="text-slate-400 text-sm font-display">{date}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-muted text-xs uppercase tracking-widest font-semibold">Depth</span>
                            <span className="text-slate-400 text-sm font-display">{s.total_beliefs || '?'} Beliefs</span>
                          </div>
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
    </div>
  )
}
