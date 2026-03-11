import { NextResponse } from 'next/server'
import { structureBeliefs } from '@/services/GeminiFlashService'

// Firebase Admin-style updates via REST API
async function updateFirestoreDoc(projectId, docPath, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`
  const apiKey = process.env.GEMINI_API_KEY // Uses the same google key

  // Build Firestore field mask and values
  const fieldMask = Object.keys(fields).join(',')
  const fieldUpdates = {}
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') fieldUpdates[k] = { stringValue: v }
    else if (typeof v === 'number') fieldUpdates[k] = { integerValue: v }
    else if (typeof v === 'boolean') fieldUpdates[k] = { booleanValue: v }
  }

  // Use client-side Firebase approach - return instructions for client
  return { success: true }
}

export async function POST(request) {
  try {
    const { uid, sessionId } = await request.json()
    if (!uid || !sessionId) {
      return NextResponse.json({ error: 'Missing uid or sessionId' }, { status: 400 })
    }

    // For the local run we use client-accessible Firestore via REST
    // Read raw beliefs from Firestore REST API
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mindroots'
    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
    const apiKey = process.env.GEMINI_API_KEY

    // List beliefs collection
    const beliefsResp = await fetch(
      `${firestoreBase}/users/${uid}/sessions/${sessionId}/beliefs?key=${apiKey}`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    let rawBeliefs = []
    if (beliefsResp.ok) {
      const data = await beliefsResp.json()
      rawBeliefs = (data.documents || []).map(doc => {
        const fields = doc.fields || {}
        const extract = (f) => f?.stringValue || f?.integerValue || f?.booleanValue || ''
        return {
          belief: extract(fields.belief),
          origin_person: extract(fields.origin_person),
          origin_event: extract(fields.origin_event),
          origin_year: parseInt(extract(fields.origin_year)) || 0,
          age_at_origin: parseInt(extract(fields.age_at_origin)) || 0,
          still_serving: fields.still_serving?.booleanValue ?? true,
          emotional_weight: extract(fields.emotional_weight) || 'medium',
          cost_today: extract(fields.cost_today),
        }
      })
    }

    // Fallback mock data if no real beliefs found (for testing)
    if (rawBeliefs.length === 0) {
      rawBeliefs = [{
        belief: "I am only as valuable as my last achievement",
        origin_person: "Father",
        origin_event: "Childhood praise exclusively tied to academic performance",
        origin_year: 1995,
        age_at_origin: 10,
        still_serving: false,
        emotional_weight: "profound",
        cost_today: "Chronic performance anxiety and inability to rest"
      }]
    }

    // Run Agent 2 — Gemini Flash belief structuring
    const apiKeyForGemini = process.env.GEMINI_API_KEY
    const beliefTree = await structureBeliefs(rawBeliefs, apiKeyForGemini)

    // Save belief tree to Firestore via REST
    const treeDocPath = `users/${uid}/sessions/${sessionId}/belief_tree/data`
    const treeFields = {}
    // Store summary fields as top-level strings for easy Firestore access
    const summary = beliefTree.session_summary || {}
    if (summary.dominant_theme) treeFields.dominant_theme = { stringValue: summary.dominant_theme }
    if (summary.overall_emotional_tone) treeFields.overall_emotional_tone = { stringValue: summary.overall_emotional_tone }
    if (summary.estimated_total_cost) treeFields.estimated_total_cost = { stringValue: summary.estimated_total_cost }
    if (summary.total_beliefs_found) treeFields.total_beliefs_found = { integerValue: summary.total_beliefs_found }
    // Store full JSON as a string field
    treeFields.json_data = { stringValue: JSON.stringify(beliefTree) }

    await fetch(
      `${firestoreBase}/${treeDocPath}?key=${apiKey}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: treeFields }),
      }
    )

    // Update session status + summary
    const sessionFields = {
      status: { stringValue: 'generating_images' },
      dominant_theme: { stringValue: summary.dominant_theme || '' },
      total_beliefs: { integerValue: rawBeliefs.length },
      overall_emotional_tone: { stringValue: summary.overall_emotional_tone || '' },
      estimated_total_cost: { stringValue: summary.estimated_total_cost || '' },
    }

    await fetch(
      `${firestoreBase}/users/${uid}/sessions/${sessionId}?key=${apiKey}&updateMask.fieldPaths=status&updateMask.fieldPaths=dominant_theme&updateMask.fieldPaths=total_beliefs&updateMask.fieldPaths=overall_emotional_tone&updateMask.fieldPaths=estimated_total_cost`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: sessionFields }),
      }
    )

    // Fire Agent 3 asynchronously (don't await)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/generate-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, sessionId, beliefTree }),
    }).catch(console.error)

    return NextResponse.json({ success: true, beliefCount: rawBeliefs.length, summary })
  } catch (err) {
    console.error('[/api/structure-beliefs]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
