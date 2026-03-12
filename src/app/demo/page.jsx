'use client'
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  🧪 DEMO PAGE — /demo                               ║
 * ║  Standalone. Delete src/app/demo/ to remove.        ║
 * ╚══════════════════════════════════════════════════════╝
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import {
  auth, db, onAuthStateChanged,
  createSession, saveBelief, updateBelief, updateSessionStatus,
} from '@/services/FirebaseService'

// ── Demo belief sets ─────────────────────────────────────────────────────────
const BASE = [
  {
    belief: "I am only as valuable as my last achievement",
    origin_person: "Father", origin_year: 1998, age_at_origin: 8,
    origin_event: "Praise exclusively tied to academic performance",
    still_serving: false, emotional_weight: "profound",
    cost_today: "Chronic performance anxiety and inability to rest",
    illustration_prompt: "A lone wooden school desk under harsh fluorescent light in an empty classroom, a single red-marked exam paper on the desk, late evening, dust particles in the beam, painterly memory aesthetic, no people",
  },
  {
    belief: "Showing vulnerability is weakness",
    origin_person: "Mother", origin_year: 2001, age_at_origin: 11,
    origin_event: "Told to stop crying and be strong after a loss",
    still_serving: false, emotional_weight: "high",
    cost_today: "Difficulty forming deep relationships or asking for help",
    illustration_prompt: "A stone wall in the rain, a single crack with a tiny green shoot pushing through, moody overcast sky, painterly, cinematic, no people",
  },
  {
    belief: "I must earn love through self-sacrifice",
    origin_person: "Older sibling", origin_year: 2005, age_at_origin: 15,
    origin_event: "Putting others first to avoid conflict at home",
    still_serving: false, emotional_weight: "profound",
    cost_today: "Resentment, burnout, difficulty setting boundaries",
    illustration_prompt: "An old kitchen table set for others, one empty chair at the head, a cold untouched meal, warm amber light from a window, painterly, no people",
  },
  {
    belief: "Success requires suffering",
    origin_person: "Teachers", origin_year: 2007, age_at_origin: 17,
    origin_event: "Rewarded only for pushing through pain or exhaustion",
    still_serving: false, emotional_weight: "medium",
    cost_today: "Inability to enjoy achievements or rest without guilt",
    illustration_prompt: "A winding road uphill into fog at dusk, heavy backpack at the roadside, worn shoes, dramatic sky, painterly cinematic, no people",
  },
]
const DEMO_5 = [...BASE, {
  belief: "The world is fundamentally unsafe",
  origin_person: "Community", origin_year: 2003, age_at_origin: 13,
  origin_event: "Witnessed unexpected loss and instability",
  still_serving: false, emotional_weight: "high",
  cost_today: "Hypervigilance, anxiety, difficulty trusting others",
  illustration_prompt: "An old house with boarded windows in a storm, one light flickering inside, fallen tree in the yard, dark moody atmosphere, painterly, no people",
}]

const DEMO_4 = BASE.slice(0, 4)

// ── Pipeline steps ────────────────────────────────────────────────────────────
const STEPS = [
  { label: '1 / 5  Seeding beliefs',           icon: '🌱' },
  { label: '2 / 5  Structuring Origin Tree',   icon: '🧠' },
  { label: '3 / 5  Generating Illustrations',  icon: '🎨' },
  { label: '4 / 5  Narrating Your Story',      icon: '🎙' },
  { label: '5 / 5  Composing PDF Report',      icon: '📄' },
]

export default function DemoPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [running, setRunning] = useState(false)
  const [stepIdx, setStepIdx] = useState(-1)
  const [log, setLog] = useState([])
  const [error, setError] = useState(null)

  const progress = stepIdx < 0 ? 0 : stepIdx >= STEPS.length ? 100 : Math.round(((stepIdx + 0.5) / STEPS.length) * 96)

  const addLog = (msg, type = 'info') => setLog(p => [...p, { msg, type, ts: Date.now() }])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (!u) router.push('/'); else setUser(u) })
    return () => unsub()
  }, [router])

  const runDemo = async (beliefs, label) => {
    if (!user || running) return
    setRunning(true); setLog([]); setStepIdx(-1); setError(null)

    try {
      // ── STEP 1: Seed beliefs ────────────────────────────────────────────────
      setStepIdx(0)
      addLog(`🚀 ${label} demo — creating session…`)
      const sid = await createSession(user.uid)
      addLog(`✓ Session ${sid.slice(0, 10)}…`)
      await updateSessionStatus(user.uid, sid, 'interviewing')

      const savedBeliefIds = []
      for (let i = 0; i < beliefs.length; i++) {
        const id = await saveBelief(user.uid, sid, { ...beliefs[i], order_index: i })
        savedBeliefIds.push(id)
        addLog(`✓ Belief ${i + 1}/${beliefs.length}: "${beliefs[i].belief.slice(0, 40)}…"`)
      }

      // ── STEP 2: Structure (Gemini Flash) ────────────────────────────────────
      setStepIdx(1)
      await updateSessionStatus(user.uid, sid, 'structuring')
      addLog('🧠 Calling Gemini Flash structuring agent…')
      let beliefTree = null
      let structuredNodes = beliefs // fallback
      try {
        const res = await fetch('/api/structure-beliefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, sessionId: sid }),
        })
        if (res.ok) {
          const data = await res.json()
          beliefTree = data.beliefTree
          if (beliefTree?.belief_nodes?.length) structuredNodes = beliefTree.belief_nodes
          addLog(`✓ Structured ${structuredNodes.length} beliefs into Origin Tree`, 'ok')
          if (beliefTree?.session_summary?.dominant_theme) {
            addLog(`  Theme: "${beliefTree.session_summary.dominant_theme}"`)
          }
        } else {
          addLog('⚠ Structure API error — using raw beliefs', 'warn')
        }
      } catch (e) {
        addLog(`⚠ Structure failed: ${e.message} — continuing`, 'warn')
      }

      // ── STEP 3: Generate illustrations per belief ────────────────────────────
      setStepIdx(2)
      await updateSessionStatus(user.uid, sid, 'generating_images')
      addLog('🎨 Generating AI illustrations…')
      const narrationParts = []
      for (let i = 0; i < beliefs.length; i++) {
        const node = structuredNodes[i] || beliefs[i]
        const prompt = node.illustration_prompt || beliefs[i].illustration_prompt
        const beliefId = savedBeliefIds[i]

        addLog(`  🖼 Belief ${i + 1}: generating image…`)
        try {
          const imgRes = await fetch('/api/generate-image-single', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              illustrationPrompt: prompt,
              beliefText: node.belief || beliefs[i].belief,
              index: i,
            }),
          })
          if (imgRes.ok) {
            const { illustrationUrl } = await imgRes.json()
            // Save illustration + enriched fields directly via Firebase SDK
            await updateBelief(user.uid, sid, beliefId, {
              illustration_url: illustrationUrl,
              written_analysis: node.written_analysis || '',
              narration_script: node.narration_script || '',
              illustration_prompt: prompt || '',
            })
            addLog(`  ✓ Illustration ${i + 1} saved`, 'ok')
          }
        } catch (e) {
          addLog(`  ⚠ Image ${i + 1} failed: ${e.message}`, 'warn')
        }
        if (node.narration_script) narrationParts.push(node.narration_script)
      }

      // ── STEP 4: Narration text ───────────────────────────────────────────────
      setStepIdx(3)
      await updateSessionStatus(user.uid, sid, 'generating_audio')
      addLog('🎙 Building narration script…')
      const dominantTheme = beliefTree?.session_summary?.dominant_theme || ''
      const narrationText = (dominantTheme ? `The thread connecting all your beliefs: ${dominantTheme}. ` : '') +
        (narrationParts.length > 0 ? narrationParts.join(' ') :
          beliefs.map(b => `You hold the belief: ${b.belief}. It formed in ${b.origin_year} through ${b.origin_person}.`).join(' '))
      // Save narration_text to session via Firebase SDK
      const sessionRef = doc(db, 'users', user.uid, 'sessions', sid)
      await updateDoc(sessionRef, {
        narration_text: narrationText,
        dominant_theme: dominantTheme,
        overall_emotional_tone: beliefTree?.session_summary?.overall_emotional_tone || 'guarded',
        estimated_total_cost: beliefTree?.session_summary?.estimated_total_cost || '',
        total_beliefs: beliefs.length,
      })
      addLog('✓ Narration script ready')

      // ── STEP 5: PDF ──────────────────────────────────────────────────────────
      setStepIdx(4)
      await updateSessionStatus(user.uid, sid, 'generating_pdf')
      addLog('📄 Generating PDF report…')
      const treeForPdf = beliefTree || {
        session_summary: {
          dominant_theme: dominantTheme,
          overall_emotional_tone: 'guarded',
          estimated_total_cost: '',
          total_beliefs_found: beliefs.length,
        },
        belief_nodes: structuredNodes,
      }
      await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, sessionId: sid, beliefTree: treeForPdf }),
      }).catch(e => addLog(`  ⚠ PDF: ${e.message}`, 'warn'))
      addLog('✓ PDF ready for download on session page')

      // ── Complete! ────────────────────────────────────────────────────────────
      await updateSessionStatus(user.uid, sid, 'complete')
      setStepIdx(5)
      addLog('🎉 All done! Redirecting to session page…', 'success')
      setTimeout(() => router.push(`/session/${sid}?uid=${user.uid}`), 1800)
    } catch (err) {
      console.error('[Demo]', err)
      setError(err.message)
      addLog(`❌ Fatal: ${err.message}`, 'error')
      setRunning(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#070a10',
      color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '60px 24px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 520 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 999, padding: '5px 14px',
          color: '#fbbf24', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20,
        }}>
          🧪 ISOLATED DEMO — DELETE src/app/demo/ WHEN DONE
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em', color: '#f8fafc' }}>
          Full Pipeline Test
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Seeds beliefs → Gemini structures → AI illustrations → Narration → PDF → Session page
        </p>
      </div>

      {/* Buttons */}
      {!running && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[[DEMO_4, '4 Beliefs', '#818CF8'], [DEMO_5, '5 Beliefs', '#a78bfa']].map(([set, label, color]) => (
            <button key={label} onClick={() => runDemo(set, label)} style={{
              padding: '14px 28px', borderRadius: 12, background: 'transparent',
              color, fontWeight: 700, fontSize: 15, border: `2px solid ${color}55`,
              cursor: 'pointer',
              boxShadow: `0 0 20px ${color}22`,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = `${color}15`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              ▶ Run with {label}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {running && (
        <div style={{ width: '100%', maxWidth: 540, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#475569' }}>
            <span style={{ color: '#94a3b8' }}>
              {stepIdx >= 0 && stepIdx < STEPS.length ? STEPS[stepIdx].icon + ' ' + STEPS[stepIdx].label : stepIdx >= STEPS.length ? '🎉 Complete!' : 'Starting…'}
            </span>
            <span style={{ color: '#818CF8', fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ height: 4, background: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #818CF8, #a78bfa)',
              width: `${progress}%`, borderRadius: 99,
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 8px rgba(129,140,248,0.6)',
            }} />
          </div>
        </div>
      )}

      {/* Steps */}
      {running && (
        <div style={{
          width: '100%', maxWidth: 540,
          background: '#0d1117', border: '1px solid #1e293b', borderRadius: 14,
          overflow: 'hidden', marginBottom: 20,
        }}>
          {STEPS.map((step, i) => {
            const done = i < stepIdx
            const active = i === stepIdx
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                background: active ? 'rgba(129,140,248,0.06)' : 'transparent',
                borderBottom: i < STEPS.length - 1 ? '1px solid #1e293b' : 'none',
                transition: 'background 0.3s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: done ? 'rgba(129,140,248,0.15)' : active ? 'rgba(129,140,248,0.1)' : '#111827',
                  border: done ? '1px solid rgba(129,140,248,0.4)' : active ? '1px solid rgba(129,140,248,0.6)' : '1px solid #1f2937',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: done ? '#818CF8' : active ? '#a78bfa' : '#334155',
                }}>
                  {done ? '✓' : step.icon}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: done ? '#818CF8' : active ? '#e2e8f0' : '#334155',
                  flex: 1,
                }}>
                  {step.label}
                </span>
                {active && (
                  <span style={{
                    fontSize: 9, color: '#818CF8', fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    background: 'rgba(129,140,248,0.1)', padding: '3px 8px', borderRadius: 4,
                  }}>
                    Running
                  </span>
                )}
                {done && (
                  <span style={{
                    fontSize: 9, color: '#4ade80', fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    background: 'rgba(74,222,128,0.08)', padding: '3px 8px', borderRadius: 4,
                  }}>
                    Done
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Log console */}
      {log.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 540,
          background: '#060810', border: '1px solid #1e293b', borderRadius: 10,
          padding: '14px 16px', fontFamily: 'ui-monospace, monospace',
          fontSize: 11.5, lineHeight: 1.9, maxHeight: 220, overflowY: 'auto',
        }}>
          {log.map((entry, i) => (
            <div key={i} style={{
              color: entry.type === 'error' ? '#f87171'
                : entry.type === 'success' ? '#34d399'
                  : entry.type === 'ok' ? '#818CF8'
                    : entry.type === 'warn' ? '#fbbf24'
                      : '#475569',
            }}>
              {entry.msg}
            </div>
          ))}
        </div>
      )}

      {error && !running && (
        <div style={{
          marginTop: 16, width: '100%', maxWidth: 540, padding: '10px 16px',
          background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 8, color: '#f87171', fontSize: 12,
        }}>
          ❌ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      <p style={{ color: '#1e293b', fontSize: 11, marginTop: 32, textAlign: 'center' }}>
        Delete <code style={{ color: '#334155' }}>src/app/demo/</code> when done testing
      </p>
    </div>
  )
}
