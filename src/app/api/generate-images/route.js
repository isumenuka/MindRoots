import { NextResponse } from 'next/server'
import { generateBeliefIllustration, generatePlaceholderImage } from '@/services/GeminiNano2Service'

function firestoreBase() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
}
function firebaseKey() { return process.env.NEXT_PUBLIC_FIREBASE_API_KEY }

async function patchDoc(path, fields) {
  const base = firestoreBase()
  const key = firebaseKey()
  const typed = {}
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') typed[k] = { stringValue: v }
    else if (typeof v === 'number') typed[k] = { integerValue: v }
    else if (typeof v === 'boolean') typed[k] = { booleanValue: v }
  }
  const masks = Object.keys(fields).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&')
  const res = await fetch(`${base}/${path}?key=${key}&${masks}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: typed }),
  })
  if (!res.ok) console.error(`[Firestore PATCH] ${path} →`, res.status, await res.text())
  return res.ok
}

async function listDocs(path) {
  const base = firestoreBase()
  const key = firebaseKey()
  const res = await fetch(`${base}/${path}?key=${key}`)
  if (!res.ok) { console.error('[Firestore LIST]', res.status); return [] }
  const data = await res.json()
  return data.documents || []
}

export async function POST(request) {
  let uid, sessionId
  try {
    const body = await request.json()
    uid = body.uid
    sessionId = body.sessionId
    const beliefTree = body.beliefTree || {}
    if (!uid || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    const nodes = beliefTree.belief_nodes || []
    const beliefDocs = await listDocs(`users/${uid}/sessions/${sessionId}/beliefs`)

    // ── Generate + save illustration for each belief node ────────────────────
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      let illustrationUrl = null

      if (node.illustration_prompt) {
        try {
          illustrationUrl = await generateBeliefIllustration(node.illustration_prompt, apiKey)
        } catch (e) {
          console.warn('[generate-images] Image gen failed:', e.message)
        }
      }
      // Always fall back to gradient SVG
      if (!illustrationUrl) {
        illustrationUrl = generatePlaceholderImage(node.belief, i)
      }

      // Find matching Firestore doc
      const targetDoc = beliefDocs[i] || beliefDocs.find(d =>
        d.fields?.belief?.stringValue === node.belief
      )
      if (targetDoc) {
        const docPath = targetDoc.name.split('/documents/')[1]
        await patchDoc(docPath, {
          illustration_url: illustrationUrl,
          written_analysis: node.written_analysis || '',
          narration_script: node.narration_script || '',
          illustration_prompt: node.illustration_prompt || '',
        })
      }
    }

    // ── Advance to generating_audio ───────────────────────────────────────────
    await patchDoc(`users/${uid}/sessions/${sessionId}`, { status: 'generating_audio' })
    console.log('[generate-images] Status → generating_audio')

    // Store narration text
    const narrationScripts = nodes.map(n => n.narration_script).filter(Boolean)
    const dominantTheme = beliefTree.session_summary?.dominant_theme || ''
    const fullNarration = (dominantTheme ? `The thread connecting all your beliefs: ${dominantTheme}. ` : '') + narrationScripts.join(' ')

    await patchDoc(`users/${uid}/sessions/${sessionId}`, {
      status: 'generating_pdf',
      narration_text: fullNarration,
    })
    console.log('[generate-images] Status → generating_pdf')

    // ── Fire generate-pdf async ───────────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, sessionId, beliefTree }),
    }).catch(e => console.error('[generate-images] pdf chain failed:', e))

    return NextResponse.json({ success: true, nodesProcessed: nodes.length })
  } catch (err) {
    console.error('[/api/generate-images] FATAL:', err)
    // Always advance so pipeline doesn't stall
    if (uid && sessionId) {
      await patchDoc(`users/${uid}/sessions/${sessionId}`, { status: 'generating_pdf' }).catch(() => {})
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, sessionId, beliefTree: {} }),
      }).catch(() => {})
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
