'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
      ` }} />
      
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-dark text-slate-100 font-sans">
        <div className="layout-container flex h-full grow flex-col">
          {/* Ambient Background Effect */}
          <div className="fixed inset-0 ambient-gradient pointer-events-none"></div>
          <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

          {/* Top Navigation Bar */}
          <header className="relative z-10 flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 py-4 lg:px-10">
            <Link href="/" className="flex items-center gap-4 text-primary cursor-pointer hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center p-2 rounded-lg bg-accent/20 text-accent">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h2 className="text-primary text-lg font-bold leading-tight tracking-tight font-display hidden sm:block">MindRoots</h2>
            </Link>
            
            <div className="flex flex-1 justify-end gap-4 lg:gap-8 items-center">
              <label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-white/5 border border-white/10">
                  <div className="text-text-muted flex items-center justify-center pl-4">
                    <span className="material-symbols-outlined text-xl">search</span>
                  </div>
                  <input className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 h-full placeholder:text-text-muted px-4 pl-2 text-sm font-normal text-slate-200" placeholder="Search sessions..." />
                </div>
              </label>
              <div className="flex gap-2">
                <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300">
                  <span className="material-symbols-outlined text-xl">calendar_today</span>
                </button>
                <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300">
                  <span className="material-symbols-outlined text-xl">tune</span>
                </button>
              </div>
              <Link href="/settings" className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 border border-white/20 overflow-hidden flex items-center justify-center group">
                 {user?.photoURL ? (
                    <img alt={user?.displayName || "Profile avatar"} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" src={user.photoURL} referrerPolicy="no-referrer" />
                  ) : (
                    <span className="material-symbols-outlined text-xl text-text-muted group-hover:text-slate-200">person</span>
                  )}
              </Link>
            </div>
          </header>

          <div className="relative z-10 flex flex-1 flex-col lg:flex-row h-full">
            {/* Sidebar Navigation */}
            <aside className="hidden lg:flex w-full lg:w-64 border-r border-white/10 p-4 flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Navigation</p>
                <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all" href="/settings">
                  <span className="material-symbols-outlined">dashboard</span>
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
                <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent text-white shadow-lg shadow-accent/20" href="/history">
                  <span className="material-symbols-outlined">folder_open</span>
                  <span className="text-sm font-medium">Archives</span>
                </Link>
                <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all" href="#">
                  <span className="material-symbols-outlined">insights</span>
                  <span className="text-sm font-medium">Insights</span>
                </Link>
                <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all" href="/settings">
                  <span className="material-symbols-outlined">settings</span>
                  <span className="text-sm font-medium">Settings</span>
                </Link>
              </div>
              <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                <p className="text-xs text-accent font-bold mb-1">PRO PLAN</p>
                <p className="text-sm text-slate-100 font-medium mb-3">Unlimited reflections & deep insights active.</p>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-accent h-full w-3/4"></div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto w-full h-full">
              <div className="max-w-6xl mx-auto">
                {/* Content Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-slate-100 text-3xl md:text-4xl font-black leading-tight tracking-tight font-display">Your Archives</h1>
                    <p className="text-text-muted text-base lg:text-lg">A reflective gallery of your past mental landscapes.</p>
                  </div>
                  <button onClick={() => router.push('/interview')} className="bg-primary text-background-dark px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2 shrink-0">
                    <span className="material-symbols-outlined text-lg">add</span>
                    New Session
                  </button>
                </div>

                {/* Grid of Session Cards */}
                {loading ? (
                  <div className="text-center py-20 w-full flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-text-muted text-sm uppercase tracking-widest font-semibold">Loading archives...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div
                    onClick={() => router.push('/interview')}
                    className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-10 group hover:border-accent/30 transition-all cursor-pointer h-full min-h-[250px]"
                  >
                    <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                      <span className="material-symbols-outlined text-text-muted group-hover:text-accent">history_edu</span>
                    </div>
                    <p className="text-text-muted text-sm font-medium text-center">Start a new reflective journey to grow your archive.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((s) => {
                      const date = s.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Unknown date'
                      
                      return (
                        <div
                          key={s.id}
                          onClick={() => router.push(`/session/${s.id}?uid=${user.uid}`)}
                          className="glass-card rounded-xl overflow-hidden group hover:border-accent/50 transition-all duration-300 cursor-pointer flex flex-col"
                        >
                          <div
                            className="h-40 w-full bg-center bg-cover relative"
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
                                <span className="text-text-muted text-xs uppercase tracking-widest font-semibold">Session Date</span>
                                <span className="text-slate-400 text-sm font-display">{date}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-text-muted text-xs uppercase tracking-widest font-semibold">Depth</span>
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
      </div>
    </>
  )
}
