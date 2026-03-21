'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged, signOut, getSessions, deleteSession } from '@/services/FirebaseService'
import useAppStore from '@/store/useAppStore'
import AppSidebar from '@/components/AppSidebar'

// Generate a unique readable title from session data when dominant_theme is blank
function sessionTitle(s) {
  if (s.dominant_theme && s.dominant_theme.trim()) return s.dominant_theme.trim()
  // Fallback: make it unique using the date + last 5 chars of session ID
  const date = s.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || ''
  const shortId = s.id ? s.id.slice(-5).toUpperCase() : ''
  return date ? `Excavation · ${date} · #${shortId}` : `Excavation #${shortId}`
}

const TONE_COLORS = {
  guarded:    { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.35)', text: '#818CF8' },
  anxious:    { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', text: '#f87171' },
  sad:        { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.35)',  text: '#60a5fa' },
  reflective: { bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.35)', text: '#facc15' },
  hopeful:    { bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)', text: '#4ade80' },
}

export default function HistoryPage() {
  const router       = useRouter()
  const storeSetUser = useAppStore(s => s.setUser)

  const [user,       setUser]       = useState(null)
  const [sessions,   setSessions]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [deletingId, setDeletingId] = useState(null)   // session id being deleted
  const [confirmId,  setConfirmId]  = useState(null)   // session id awaiting confirm

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

  const handleDelete = async (sessionId, e) => {
    e.stopPropagation()
    setDeletingId(sessionId)
    try {
      await deleteSession(user.uid, sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (err) {
      console.error('[Delete session]', err)
    }
    setDeletingId(null)
    setConfirmId(null)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0A] text-slate-100 font-sans relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-[#818CF8]/4 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar */}
      <AppSidebar user={user} onSignOut={handleSignOut} signingOut={signingOut} />

      {/* Mobile top bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 h-14 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-xl">
        <span className="font-display font-bold text-white text-lg">History</span>
        <button onClick={() => router.push('/settings')} className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            : <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
          }
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

          {/* Sentiment Analytics Dashboard */}
          {!loading && sessions.length > 0 && (
            <div className="mb-12 glass-card rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
              <div className="flex-1 w-full">
                <h2 className="text-xl font-display font-bold text-white mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#818CF8]">monitoring</span>
                  Sentiment Progression
                </h2>
                <p className="text-slate-400 text-sm mb-6">Your emotional journey over your recorded excavations.</p>
                
                {/* Visual Tracker Bar */}
                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                  {sessions.slice().reverse().map((s, idx) => {
                    const tone = s.overall_emotional_tone?.toLowerCase()
                    const toneCfg = TONE_COLORS[tone] || TONE_COLORS.guarded
                    return (
                      <div 
                        key={idx} 
                        style={{ backgroundColor: toneCfg.text, width: `${100 / sessions.length}%` }}
                        className="h-full border-r border-[#0A0A0A] hover:opacity-80 transition-opacity"
                        title={`${s.created_at?.toDate?.()?.toLocaleDateString() || 'Session'} - ${s.overall_emotional_tone}`}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-semibold uppercase mt-3">
                  <span>First Session</span>
                  <span>Latest</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 w-full lg:w-auto shrink-0">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-[140px] flex flex-col justify-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Excavations</span>
                  <span className="text-3xl font-display font-black text-white">{sessions.length}</span>
                </div>
                <div className="bg-[#818CF8]/10 border border-[#818CF8]/20 rounded-2xl p-5 min-w-[140px] flex flex-col justify-center">
                  <span className="text-[#818CF8] text-xs font-semibold uppercase tracking-wider mb-1">Total Beliefs</span>
                  <span className="text-3xl font-display font-black text-[#818CF8]">
                    {sessions.reduce((acc, curr) => acc + (curr.total_beliefs || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

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
                const date    = s.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Unknown'
                const title   = sessionTitle(s)
                const tone    = s.overall_emotional_tone?.toLowerCase()
                const toneCfg = TONE_COLORS[tone] || TONE_COLORS.guarded
                const isDeleting = deletingId === s.id
                const isConfirm  = confirmId  === s.id

                return (
                  <div
                    key={s.id}
                    onClick={() => !isConfirm && router.push(`/session/${s.id}?uid=${user.uid}`)}
                    className="group relative bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-[#818CF8]/40 hover:bg-white/[0.05] transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    {/* Accent bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#818CF8] to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div className="p-6 flex flex-col gap-3 grow">
                      {/* Top row: tone badge + delete button */}
                      <div className="flex items-start justify-between gap-2">
                        {tone ? (
                          <span
                            className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border"
                            style={{ background: toneCfg.bg, borderColor: toneCfg.border, color: toneCfg.text }}
                          >
                            {s.overall_emotional_tone}
                          </span>
                        ) : <span />}

                        {/* Delete button */}
                        {!isConfirm ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmId(s.id) }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 shrink-0"
                            title="Delete session"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        ) : (
                          /* Confirm row */
                          <div
                            className="flex items-center gap-1.5 ml-auto"
                            onClick={e => e.stopPropagation()}
                          >
                            <span className="text-[11px] text-red-400 font-semibold mr-1">Delete?</span>
                            <button
                              onClick={(e) => handleDelete(s.id, e)}
                              disabled={isDeleting}
                              className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              {isDeleting ? '…' : 'Yes'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmId(null) }}
                              className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/20 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-slate-100 text-lg font-display font-bold group-hover:text-[#818CF8] transition-colors line-clamp-2 leading-snug">
                        {title}
                      </h3>

                      {/* Footer */}
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
