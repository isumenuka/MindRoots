import { NextResponse } from 'next/server'
import { structureBeliefs } from '@/services/GeminiFlashService'

// ── Shared Firestore REST helper ──────────────────────────────────────────────
function firestoreBase() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
}
// Firebase Web API key — this is the correct key for Firestore REST API
function firebaseKey() { return process.env.NEXT_PUBLIC_FIREBASE_API_KEY }

async function patchDoc(path, fields, extraMasks = []) {
  const base = firestoreBase()
  const key = firebaseKey()
  const masks = Object.keys(fields).concat(extraMasks)
  const maskQuery = masks.map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&')

  // Build typed field object
  const typed = {}
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') typed[k] = { stringValue: v }
    else if (typeof v === 'number') typed[k] = { integerValue: v }
    else if (typeof v === 'boolean') typed[k] = { booleanValue: v }
  }

  const res = await fetch(`${base}/${path}?key=${key}&${maskQuery}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: typed }),
  })
  if (!res.ok) {
    const txt = await res.text()
    console.error(`[Firestore PATCH] ${path} →`, res.status, txt)
  }
  return res.ok
}

async function listDocs(path) {
  const base = firestoreBase()
  const key = firebaseKey()
  const res = await fetch(`${base}/${path}?key=${key}`)
  if (!res.ok) { console.error('[Firestore LIST]', res.status, await res.text()); return [] }
  const data = await res.json()
  return data.documents || []
}

function extractField(f) {
  if (!f) return ''
  return f.stringValue ?? f.integerValue ?? f.booleanValue ?? ''
}

// ── POST handler ───────────────────────────────────────────────────────────────
export async function POST(request) {
  // Derive baseUrl from the incoming request so we work in ALL environments
  // (local dev, Cloud Run, etc.) without relying on NEXT_PUBLIC_APP_URL
  const reqUrl = new URL(request.url)
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`
  let uid, sessionId
  try {
    const body = await request.json()
    uid = body.uid
    sessionId = body.sessionId
    if (!uid || !sessionId) {
      return NextResponse.json({ error: 'Missing uid or sessionId' }, { status: 400 })
    }

    // ── 1. Read raw beliefs from Firestore ────────────────────────────────────
    const beliefDocs = await listDocs(`users/${uid}/sessions/${sessionId}/beliefs`)
    let rawBeliefs = beliefDocs.map(doc => {
      const f = doc.fields || {}
      return {
        belief: extractField(f.belief),
        origin_person: extractField(f.origin_person),
        origin_event: extractField(f.origin_event),
        origin_year: parseInt(extractField(f.origin_year)) || 0,
        age_at_origin: parseInt(extractField(f.age_at_origin)) || 0,
        still_serving: f.still_serving?.booleanValue ?? true,
        emotional_weight: extractField(f.emotional_weight) || 'medium',
        cost_today: extractField(f.cost_today),
      }
    }).filter(b => b.belief)

    console.log(`[structure-beliefs] Found ${rawBeliefs.length} beliefs for session ${sessionId}`)

    // Fallback if empty
    if (rawBeliefs.length === 0) {
      rawBeliefs = [{
        belief: "I am only as valuable as my last achievement",
        origin_person: "Father",
        origin_event: "Childhood praise exclusively tied to academic performance",
        origin_year: 1995, age_at_origin: 10, still_serving: false,
        emotional_weight: "profound",
        cost_today: "Chronic performance anxiety and inability to rest",
      }]
    }

    // ── 2. Gemini Flash — structure beliefs into Origin Tree ──────────────────
    let beliefTree
    try {
      beliefTree = await structureBeliefs(rawBeliefs, process.env.GEMINI_API_KEY)
      console.log('[structure-beliefs] Gemini structuring succeeded')
    } catch (err) {
      console.warn('[structure-beliefs] Gemini failed, using fallback:', err.message)
      beliefTree = {
        session_summary: {
          total_beliefs_found: rawBeliefs.length,
          oldest_belief_year: Math.min(...rawBeliefs.map(b => b.origin_year || 2000)),
          dominant_theme: 'A pattern of inherited beliefs shaping daily choices',
          estimated_total_cost: 'Significant emotional and relational cost',
          overall_emotional_tone: 'guarded',
        },
        belief_nodes: rawBeliefs.map((b, i) => ({
          id: `belief_${i + 1}`,
          ...b,
          illustration_prompt: `A moody, memory-like scene evoking "${b.belief}". Cinematic, painterly, no people.`,
          written_analysis: `This belief — "${b.belief}" — originated with ${b.origin_person} during ${b.origin_event}. Today it costs: ${b.cost_today}.`,
          narration_script: `You hold a core belief: ${b.belief}. It formed in ${b.origin_year} through your relationship with ${b.origin_person}.`,
        })),
      }
    }

    const summary = beliefTree.session_summary || {}

    // ── 3. Save belief tree to Firestore ──────────────────────────────────────
    await patchDoc(
      `users/${uid}/sessions/${sessionId}/belief_tree/data`,
      {
        dominant_theme: summary.dominant_theme || '',
        overall_emotional_tone: summary.overall_emotional_tone || '',
        estimated_total_cost: summary.estimated_total_cost || '',
        total_beliefs_found: summary.total_beliefs_found || rawBeliefs.length,
        json_data: JSON.stringify(beliefTree),
      }
    )

    // ── 4. Advance session status → generating_images ─────────────────────────
    const advanced = await patchDoc(
      `users/${uid}/sessions/${sessionId}`,
      {
        status: 'generating_images',
        dominant_theme: summary.dominant_theme || '',
        total_beliefs: rawBeliefs.length,
        overall_emotional_tone: summary.overall_emotional_tone || '',
        estimated_total_cost: summary.estimated_total_cost || '',
      }
    )
    console.log('[structure-beliefs] Status advanced to generating_images:', advanced)

    // ── 5. Fire generate-images async ─────────────────────────────────────────
    fetch(`${baseUrl}/api/generate-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, sessionId, beliefTree, baseUrl }),
    }).catch(e => console.error('[structure-beliefs] generate-images chain failed:', e))

    return NextResponse.json({ success: true, beliefCount: rawBeliefs.length, summary })
  } catch (err) {
    console.error('[/api/structure-beliefs] FATAL:', err)
    // Emergency: still try to advance status so pipeline doesn't stay stuck
    if (uid && sessionId) {
      await patchDoc(`users/${uid}/sessions/${sessionId}`, { status: 'generating_images' }).catch(() => {})
      fetch(`${baseUrl}/api/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, sessionId, beliefTree: { belief_nodes: [], session_summary: {} }, baseUrl }),
      }).catch(() => {})
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
