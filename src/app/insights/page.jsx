'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged, signOut, getSessions, getBeliefs } from '@/services/FirebaseService'
import useAppStore from '@/store/useAppStore'
import AppSidebar from '@/components/AppSidebar'

// ─── helpers ──────────────────────────────────────────────────────────────────
function pct(n, total) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

const TONE_CFG = {
  guarded:    { color: '#818CF8', label: 'Guarded'    },
  anxious:    { color: '#f87171', label: 'Anxious'    },
  sad:        { color: '#60a5fa', label: 'Sad'        },
  reflective: { color: '#facc15', label: 'Reflective' },
  hopeful:    { color: '#4ade80', label: 'Hopeful'    },
  neutral:    { color: '#94a3b8', label: 'Neutral'    },
}

const WEIGHT_CFG = {
  profound: { color: '#f87171', label: 'Profound' },
  high:     { color: '#fb923c', label: 'High'     },
  medium:   { color: '#facc15', label: 'Medium'   },
  low:      { color: '#4ade80', label: 'Low'       },
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent = '#818CF8' }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 flex flex-col gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}18` }}>
        <span className="material-symbols-outlined text-[20px]" style={{ color: accent }}>{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-display font-black text-white">{value}</p>
        <p className="text-sm font-semibold text-slate-200 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-[#818CF8]/12 border border-[#818CF8]/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-[#818CF8] text-[18px]">{icon}</span>
      </div>
      <div>
        <h2 className="font-display font-bold text-white text-base">{title}</h2>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const router       = useRouter()
  const storeSetUser = useAppStore(s => s.setUser)

  const [user,     setUser]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [sessions, setSessions] = useState([])
  const [beliefs,  setBeliefs]  = useState([])
  const [signingOut, setSigningOut] = useState(false)

  const loadData = async (u) => {
    setLoading(true)
    setFetchError(false)
    try {
      const ses = await getSessions(u.uid)
      setSessions(ses)
      const allBeliefs = await Promise.all(ses.map(s => getBeliefs(u.uid, s.id)))
      setBeliefs(allBeliefs.flat())
    } catch (e) {
      console.error('[Insights] Failed to load data:', e)
      setFetchError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/'); return }
      setUser(u)
      loadData(u)
    })
    return () => unsub()
  }, [router])

  const handleSignOut = async () => {
    setSigningOut(true)
    try { await signOut(); storeSetUser(null); router.push('/') }
    catch (e) { console.error(e); setSigningOut(false) }
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalBeliefs  = beliefs.length
  const avgPerSession = totalSessions ? (totalBeliefs / totalSessions).toFixed(1) : '—'
  const firstDate     = sessions.length
    ? sessions[sessions.length - 1]?.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—'

  // Emotional tone distribution (from sessions)
  const toneCounts = {}
  sessions.forEach(s => {
    const k = s.overall_emotional_tone?.toLowerCase() || 'neutral'
    toneCounts[k] = (toneCounts[k] || 0) + 1
  })
  const toneEntries = Object.entries(toneCounts).sort((a, b) => b[1] - a[1])

  // Emotional weight distribution (from beliefs)
  const weightCounts = { profound: 0, high: 0, medium: 0, low: 0 }
  beliefs.forEach(b => { if (weightCounts[b.emotional_weight] !== undefined) weightCounts[b.emotional_weight]++ })

  // Still serving
  const notServing  = beliefs.filter(b => b.still_serving === false).length
  const stillActive = beliefs.filter(b => b.still_serving === true).length
  const unknown     = totalBeliefs - notServing - stillActive

  // Top influencers (origin_person)
  const personCounts = {}
  beliefs.forEach(b => {
    const p = b.origin_person?.trim()
    if (p) personCounts[p] = (personCounts[p] || 0) + 1
  })
  const topPeople = Object.entries(personCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Beliefs per session timeline (oldest → newest, max 10)
  const timeline = [...sessions]
    .reverse()
    .slice(-10)
    .map(s => ({
      label: s.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || '?',
      count: s.total_beliefs || 0,
      tone:  s.overall_emotional_tone?.toLowerCase() || 'neutral',
    }))
  const maxBar = Math.max(...timeline.map(t => t.count), 1)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0A] text-slate-100 font-sans relative">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-[#818CF8]/4 blur-[120px] rounded-full" />
      </div>

      <AppSidebar user={user} onSignOut={handleSignOut} signingOut={signingOut} />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-center px-14 h-14 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-xl">
        <span className="font-display font-bold text-white text-lg">Insights</span>
        <button onClick={() => router.push('/settings')} className="absolute right-4 w-9 h-9 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            : <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
          }
        </button>
      </div>

      <main className="flex-1 overflow-y-auto relative z-10 pt-14 md:pt-0">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 md:py-10 pb-24 md:pb-10">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Insights</h1>
            <p className="text-slate-500 mt-1">Patterns and trends discovered across all your excavations.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-[#818CF8] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold">Analysing your mind…</p>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <span className="material-symbols-outlined text-[48px] text-red-400">cloud_off</span>
              <p className="text-slate-400 text-base">Couldn&apos;t load your insights.</p>
              <button onClick={() => user && loadData(user)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#818CF8] text-white rounded-xl font-bold text-sm hover:bg-[#818CF8]/90 transition-colors">
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Retry
              </button>
            </div>
          ) : totalSessions === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">insights</span>
              <p className="text-slate-400 font-semibold">No data yet</p>
              <p className="text-slate-600 text-sm mt-1">Complete at least one session to see your insights.</p>
              <button onClick={() => router.push('/interview')}
                className="mt-6 px-5 py-2.5 bg-[#818CF8] text-white rounded-xl font-bold text-sm hover:bg-[#818CF8]/90 transition-colors">
                Start a Session
              </button>
            </div>
          ) : (
            <div className="space-y-10">

              {/* ── 1. Summary Stats ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="psychology"    label="Total Sessions"     value={totalSessions} sub="completed excavations" />
                <StatCard icon="hub"           label="Total Beliefs Found" value={totalBeliefs}  sub="across all sessions"   accent="#fb923c" />
                <StatCard icon="calculate"     label="Avg Beliefs/Session" value={avgPerSession} sub="depth indicator"       accent="#facc15" />
                <StatCard icon="calendar_month" label="Excavating Since"   value={firstDate}     sub="your first session"    accent="#4ade80" />
              </div>

              {/* ── 2. Emotional Tone + Weight (side by side) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Tone distribution */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                  <SectionHeader icon="mood" title="Emotional Tone Distribution" sub="How you felt across sessions" />
                  {toneEntries.length === 0
                    ? <p className="text-slate-600 text-sm">No tone data yet.</p>
                    : (
                      <div className="space-y-3">
                        {toneEntries.map(([tone, count]) => {
                          const cfg = TONE_CFG[tone] || { color: '#94a3b8', label: tone }
                          const p   = pct(count, totalSessions)
                          return (
                            <div key={tone}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-semibold text-slate-300">{cfg.label}</span>
                                <span className="text-xs text-slate-500 font-mono">{count} session{count !== 1 ? 's' : ''} · {p}%</span>
                              </div>
                              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${p}%`, background: cfg.color }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }
                </div>

                {/* Weight breakdown */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                  <SectionHeader icon="warning" title="Emotional Weight Breakdown" sub="Intensity of your excavated beliefs" />
                  <div className="space-y-3">
                    {Object.entries(WEIGHT_CFG).map(([key, cfg]) => {
                      const count = weightCounts[key]
                      const p     = pct(count, totalBeliefs)
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                              <span className="text-sm font-semibold text-slate-300">{cfg.label}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">{count} belief{count !== 1 ? 's' : ''} · {p}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${p}%`, background: cfg.color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* ── 3. Serving Status ── */}
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                <SectionHeader icon="self_improvement" title="Beliefs Still Serving You?" sub="How many beliefs are limiting vs. neutral" />
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Blocking You',    value: notServing,  color: '#f87171', icon: 'block'        },
                    { label: 'Still Serving',   value: stillActive, color: '#4ade80', icon: 'check_circle' },
                    { label: 'Unclassified',    value: unknown,     color: '#94a3b8', icon: 'help'         },
                  ].map(({ label, value, color, icon }) => (
                    <div key={label} className="flex flex-col items-center justify-center p-6 rounded-2xl border text-center"
                      style={{ background: `${color}08`, borderColor: `${color}25` }}>
                      <span className="material-symbols-outlined text-[28px] mb-2" style={{ color }}>{icon}</span>
                      <p className="text-4xl font-display font-black mb-1" style={{ color }}>{value}</p>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>
                {/* Visual ratio bar */}
                {totalBeliefs > 0 && (
                  <div className="mt-5 h-3 w-full rounded-full overflow-hidden flex">
                    {notServing  > 0 && <div style={{ width: `${pct(notServing,  totalBeliefs)}%`, background: '#f87171' }} />}
                    {stillActive > 0 && <div style={{ width: `${pct(stillActive, totalBeliefs)}%`, background: '#4ade80' }} />}
                    {unknown     > 0 && <div style={{ width: `${pct(unknown,     totalBeliefs)}%`, background: '#334155' }} />}
                  </div>
                )}
              </div>

              {/* ── 4. Top Influencers ── */}
              {topPeople.length > 0 && (
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                  <SectionHeader icon="group" title="Top Origin Influences" sub="People or events that shaped your beliefs the most" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {topPeople.map(([person, count], i) => (
                      <div key={person} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] transition-colors">
                        <div className="w-9 h-9 rounded-full bg-[#818CF8]/20 border border-[#818CF8]/30 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-[#818CF8]">#{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{person}</p>
                          <p className="text-xs text-slate-500">{count} belief{count !== 1 ? 's' : ''} attributed</p>
                        </div>
                        <div className="shrink-0">
                          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#818CF8] rounded-full"
                              style={{ width: `${pct(count, topPeople[0][1])}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 5. Beliefs Per Session Timeline ── */}
              {timeline.length > 0 && (
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                  <SectionHeader icon="bar_chart" title="Excavation Timeline" sub="Beliefs uncovered per session (last 10)" />
                  <div className="flex items-end gap-2 h-40 mt-4">
                    {timeline.map((t, i) => {
                      const cfg     = TONE_CFG[t.tone] || { color: '#818CF8' }
                      const barPct  = pct(t.count, maxBar)
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <span className="text-xs font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cfg.color }}>
                            {t.count}
                          </span>
                          <div
                            className="w-full rounded-t-lg transition-all duration-500"
                            style={{
                              height: `${Math.max(barPct, 4)}%`,
                              background: cfg.color,
                              opacity: 0.7,
                            }}
                          />
                          <span className="text-[10px] text-slate-600 text-center leading-tight">{t.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  )
}
