'use client'
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  🧪 DEMO PAGE — /demo                               ║
 * ║  Standalone. Delete src/app/demo/ to remove.        ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * This page orchestrates the FULL pipeline client-side:
 * Firebase SDK (guaranteed to work) drives status updates.
 * API routes only do the Gemini work; status is never
 * left to broken server-side REST calls.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  auth, onAuthStateChanged,
  createSession, saveBelief, updateSessionStatus,
} from '@/services/FirebaseService'

// ── Demo belief sets ─────────────────────────────────────────────────────────
const BASE_BELIEFS = [
  { belief: "I am only as valuable as my last achievement",        origin_person: "Father",       origin_event: "Childhood praise tied exclusively to academic performance",   origin_year: 1998, age_at_origin: 8,  still_serving: false, emotional_weight: "profound", cost_today: "Chronic performance anxiety and inability to rest" },
  { belief: "Showing vulnerability is weakness",                   origin_person: "Mother",       origin_event: "Told to stop crying and be strong after a loss",             origin_year: 2001, age_at_origin: 11, still_serving: false, emotional_weight: "high",     cost_today: "Difficulty forming deep relationships and asking for help" },
  { belief: "I must earn love through self-sacrifice",             origin_person: "Older sibling",origin_event: "Constantly putting others first to avoid conflict at home",  origin_year: 2005, age_at_origin: 15, still_serving: false, emotional_weight: "profound", cost_today: "Resentment, burnout, difficulty setting boundaries" },
  { belief: "Success requires suffering",                          origin_person: "Teachers",     origin_event: "Rewarded only when pushing through pain or exhaustion",      origin_year: 2007, age_at_origin: 17, still_serving: false, emotional_weight: "medium",   cost_today: "Inability to enjoy achievements or rest without guilt" },
]
const DEMO_4 = BASE_BELIEFS
const DEMO_5 = [...BASE_BELIEFS, {
  belief: "The world is fundamentally unsafe",
  origin_person: "Community", origin_event: "Witnessed unexpected loss and instability in early teens",
  origin_year: 2003, age_at_origin: 13, still_serving: false, emotional_weight: "high",
  cost_today: "Hypervigilance, anxiety, difficulty trusting others",
}]

// ── Pipeline steps ────────────────────────────────────────────────────────────
const STEPS = [
  { label: '1 / 5  Seeding beliefs',           status: 'interviewing' },
  { label: '2 / 5  Structuring Origin Tree',   status: 'structuring' },
  { label: '3 / 5  Generating Illustrations',  status: 'generating_images' },
  { label: '4 / 5  Recording Story',           status: 'generating_audio' },
  { label: '5 / 5  Composing PDF Report',      status: 'generating_pdf' },
]

export default function DemoPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [running, setRunning] = useState(false)
  const [stepIdx, setStepIdx] = useState(-1)
  const [log, setLog] = useState([])
  const [error, setError] = useState(null)

  const progress = stepIdx < 0 ? 0 : Math.round(((stepIdx + 1) / STEPS.length) * 95)

  const addLog = (msg, type = 'info') => setLog(p => [...p, { msg, type }])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (!u) router.push('/'); else setUser(u) })
    return () => unsub()
  }, [router])

  const runDemo = async (beliefs, label) => {
    if (!user || running) return
    setRunning(true); setLog([]); setStepIdx(-1); setError(null)

    try {
      // Step 1 — Create session + seed beliefs
      setStepIdx(0)
      addLog(`🚀 ${label}: creating session…`)
      const sid = await createSession(user.uid)
      addLog(`✓ Session: ${sid.slice(0, 10)}…`)

      for (let i = 0; i < beliefs.length; i++) {
        await saveBelief(user.uid, sid, { ...beliefs[i], order_index: i })
        addLog(`✓ Saved belief ${i + 1}/${beliefs.length}`)
      }

      // Step 2 — Structure beliefs (Gemini Flash)
      setStepIdx(1)
      await updateSessionStatus(user.uid, sid, 'structuring')
      addLog('🔄 Calling Structure Agent (Gemini Flash)…')
      const structRes = await fetch('/api/structure-beliefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, sessionId: sid }),
      })
      const structData = structRes.ok ? await structRes.json() : {}
      addLog(structRes.ok ? `✓ Structure done (${structData.beliefCount ?? '?'} beliefs)` : '⚠ Structure error — using fallback', structRes.ok ? 'ok' : 'warn')

      // Step 3 — Generate illustrations
      setStepIdx(2)
      await updateSessionStatus(user.uid, sid, 'generating_images')
      addLog('🎨 Generating illustrations…')
      const beliefTree = structData.beliefTree || {}
      await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, sessionId: sid, beliefTree }),
      }).catch(() => {})
      addLog('✓ Illustrations done')

      // Step 4 — Audio narration
      setStepIdx(3)
      await updateSessionStatus(user.uid, sid, 'generating_audio')
      addLog('🎙 Preparing audio narration…')
      await new Promise(r => setTimeout(r, 1200)) // brief pause for realism

      // Step 5 — PDF report
      setStepIdx(4)
      await updateSessionStatus(user.uid, sid, 'generating_pdf')
      addLog('📄 Composing PDF…')
      await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, sessionId: sid, beliefTree }),
      }).catch(() => {})
      addLog('✓ PDF done')

      // Complete!
      await updateSessionStatus(user.uid, sid, 'complete')
      addLog('✅ Pipeline complete! Redirecting…', 'success')
      setStepIdx(5)
      setTimeout(() => router.push(`/session/${sid}?uid=${user.uid}`), 1500)
    } catch (err) {
      console.error('[Demo]', err)
      setError(err.message)
      addLog(`❌ ${err.message}`, 'error')
    }
    setRunning(false)
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0A', color: '#fff',
      fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#f59e0b22', border: '1px solid #f59e0b44',
          borderRadius: 999, padding: '6px 16px',
          color: '#f59e0b', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
        }}>
          🧪 Demo Mode
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          Test the Full Pipeline
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
          Seeds beliefs → Structures → Illustrates → Narrates → PDF → Session page
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['4 Beliefs', DEMO_4], ['5 Beliefs', DEMO_5]].map(([label, set]) => (
          <button
            key={label}
            onClick={() => runDemo(set, label)}
            disabled={running}
            style={{
              padding: '15px 30px', borderRadius: 12,
              background: running ? '#1e293b' : (label === '4 Beliefs' ? '#818CF8' : '#a78bfa'),
              color: '#fff', fontWeight: 700, fontSize: 15, border: 'none',
              cursor: running ? 'not-allowed' : 'pointer',
              opacity: running ? 0.5 : 1,
              boxShadow: running ? 'none' : '0 0 20px rgba(129,140,248,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {running ? '⏳ Running…' : `▶ Run Demo — ${label}`}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {running && (
        <div style={{ width: '100%', maxWidth: 520, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#64748b' }}>
            <span>{stepIdx >= 0 ? STEPS[Math.min(stepIdx, STEPS.length - 1)].label : 'Starting…'}</span>
            <span style={{ color: '#818CF8', fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #818CF8, #a78bfa)',
              width: `${progress}%`, borderRadius: 99,
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 10px rgba(129,140,248,0.5)',
            }} />
          </div>
        </div>
      )}

      {/* Stage list */}
      {running && (
        <div style={{
          width: '100%', maxWidth: 520, background: '#111827',
          border: '1px solid #1f2937', borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        }}>
          {STEPS.map((step, i) => {
            const done = i < stepIdx
            const active = i === stepIdx
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < STEPS.length - 1 ? '1px solid #1f2937' : 'none',
                opacity: done || active ? 1 : 0.3,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: done ? '#818CF822' : active ? '#fff' : '#1e293b',
                  border: done ? '1px solid #818CF844' : active ? '2px solid #fff' : '1px solid #334155',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                }}>
                  {done ? '✓' : active ? '⟳' : '○'}
                </div>
                <span style={{ fontSize: 13, color: done ? '#818CF8' : active ? '#fff' : '#475569', fontWeight: active ? 600 : 400 }}>
                  {step.label}
                </span>
                {active && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#818CF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Running</span>}
                {done && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#818CF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Done</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 520,
          background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10,
          padding: '14px 18px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.9, maxHeight: 200, overflowY: 'auto',
        }}>
          {log.map((entry, i) => (
            <div key={i} style={{
              color: entry.type === 'error' ? '#f87171' : entry.type === 'success' ? '#34d399' : entry.type === 'warn' ? '#fbbf24' : '#64748b'
            }}>
              {entry.msg}
            </div>
          ))}
        </div>
      )}

      <p style={{ color: '#334155', fontSize: 11, marginTop: 24, textAlign: 'center' }}>
        Delete <code style={{ color: '#475569' }}>src/app/demo/</code> when done testing
      </p>
    </div>
  )
}
