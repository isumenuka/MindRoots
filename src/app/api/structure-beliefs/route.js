import { NextResponse } from 'next/server'
import { structureBeliefs } from '@/services/GeminiFlashService'
import { getAdminDb } from '@/services/FirebaseAdminService'

// ── POST handler ───────────────────────────────────────────────────────────────
export async function POST(request) {
  // Use internal loopback to avoid external SSL/Cloud Run routing issues
  const baseUrl = `http://127.0.0.1:${process.env.PORT || 3000}`

  let uid, sessionId
  try {
    const body = await request.json()
    uid = body.uid
    sessionId = body.sessionId
    if (!uid || !sessionId) {
      return NextResponse.json({ error: 'Missing uid or sessionId' }, { status: 400 })
    }

    const db = getAdminDb()

    // ── 1. Read raw beliefs from Firestore (Admin SDK — bypasses rules) ──────
    const beliefsSnap = await db.collection(`users/${uid}/sessions/${sessionId}/beliefs`).get()
    let rawBeliefs = beliefsSnap.docs.map(doc => {
      const f = doc.data()
      return {
        belief: f.belief || '',
        origin_person: f.origin_person || '',
        origin_event: f.origin_event || '',
        origin_year: parseInt(f.origin_year) || 0,
        age_at_origin: parseInt(f.age_at_origin) || 0,
        still_serving: f.still_serving !== undefined ? f.still_serving : true,
        emotional_weight: f.emotional_weight || 'medium',
        cost_today: f.cost_today || '',
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

    // ── 3. Save belief tree to Firestore (Admin SDK) ──────────────────────────
    await db.doc(`users/${uid}/sessions/${sessionId}/belief_tree/data`).set({
      dominant_theme: summary.dominant_theme || '',
      overall_emotional_tone: summary.overall_emotional_tone || '',
      estimated_total_cost: summary.estimated_total_cost || '',
      total_beliefs_found: summary.total_beliefs_found || rawBeliefs.length,
      json_data: JSON.stringify(beliefTree),
    })

    // ── 4. Advance session status → generating_images ─────────────────────────
    await db.doc(`users/${uid}/sessions/${sessionId}`).update({
      status: 'generating_images',
      dominant_theme: summary.dominant_theme || '',
      total_beliefs: rawBeliefs.length,
      overall_emotional_tone: summary.overall_emotional_tone || '',
      estimated_total_cost: summary.estimated_total_cost || '',
    })
    console.log('[structure-beliefs] Status → generating_images')

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
      try {
        const db = getAdminDb()
        await db.doc(`users/${uid}/sessions/${sessionId}`).update({ status: 'generating_images' })
        fetch(`${baseUrl}/api/generate-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, sessionId, beliefTree: { belief_nodes: [], session_summary: {} }, baseUrl }),
        }).catch(() => {})
      } catch {}
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
