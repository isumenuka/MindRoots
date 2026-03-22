import { NextResponse } from 'next/server'
import { generateBeliefIllustration, generatePlaceholderImage } from '@/services/GeminiNano2Service'
import { getAdminDb } from '@/services/FirebaseAdminService'

export async function POST(request) {
  let uid, sessionId
  try {
    const body = await request.json()
    uid = body.uid
    sessionId = body.sessionId
    const beliefTree = body.beliefTree || {}
    // Use internal loopback to avoid external SSL/Cloud Run routing issues
    const baseUrl = `http://127.0.0.1:${process.env.PORT || 3000}`

    if (!uid || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getAdminDb()
    // Resolve API key: user's personal key first, then server fallback
    const userSnap = await db.doc(`users/${uid}`).get()
    const apiKey = userSnap.data()?.gemini_api_key || process.env.GEMINI_API_KEY
    const nodes = beliefTree.belief_nodes || []

    // Read existing belief docs so we can match and update them
    const beliefsSnap = await db.collection(`users/${uid}/sessions/${sessionId}/beliefs`).get()
    const beliefDocs = beliefsSnap.docs

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

      // Find matching Firestore doc by index or belief text
      const targetDoc = beliefDocs[i] || beliefDocs.find(d => d.data()?.belief === node.belief)
      if (targetDoc) {
        await targetDoc.ref.update({
          illustration_url: illustrationUrl,
          written_analysis: node.written_analysis || '',
          narration_script: node.narration_script || '',
          illustration_prompt: node.illustration_prompt || '',
        })
      }
    }

    // ── Build narration text ──────────────────────────────────────────────────
    const narrationScripts = nodes.map(n => n.narration_script).filter(Boolean)
    const dominantTheme = beliefTree.session_summary?.dominant_theme || ''
    const fullNarration = (dominantTheme ? `The thread connecting all your beliefs: ${dominantTheme}. ` : '') +
      narrationScripts.join(' ')

    // ── Advance to generating_pdf ─────────────────────────────────────────────
    await db.doc(`users/${uid}/sessions/${sessionId}`).update({
      status: 'generating_pdf',
      narration_text: fullNarration,
    })
    console.log('[generate-images] Status → generating_pdf')

    // ── Fire generate-pdf async ───────────────────────────────────────────────
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
      try {
        const db = getAdminDb()
        await db.doc(`users/${uid}/sessions/${sessionId}`).update({ status: 'generating_pdf' })
        const baseUrl = `http://127.0.0.1:${process.env.PORT || 3000}`
        fetch(`${baseUrl}/api/generate-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, sessionId, beliefTree: {} }),
        }).catch(() => {})
      } catch {}
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
