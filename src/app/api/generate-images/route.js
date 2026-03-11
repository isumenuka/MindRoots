import { NextResponse } from 'next/server'
import { generateBeliefIllustration, generatePlaceholderImage } from '@/services/GeminiNano2Service'

export async function POST(request) {
  try {
    const { uid, sessionId, beliefTree } = await request.json()
    if (!uid || !sessionId || !beliefTree) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mindroots'
    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
    const apiKey = process.env.GEMINI_API_KEY

    const nodes = beliefTree.belief_nodes || []

    // Generate illustrations for each belief node
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      let illustrationUrl = null

      // Try Gemini image generation
      if (node.illustration_prompt) {
        try {
          illustrationUrl = await generateBeliefIllustration(node.illustration_prompt, apiKey)
        } catch (e) {
          console.warn('[generate-images] Image gen failed, using placeholder:', e.message)
        }
      }

      // Fallback to generated SVG placeholder
      if (!illustrationUrl) {
        illustrationUrl = generatePlaceholderImage(node.belief, i)
      }

      // Update the belief node in Firestore beliefs subcollection
      // First, list the beliefs to find the matching doc by order_index
      const beliefsResp = await fetch(
        `${firestoreBase}/users/${uid}/sessions/${sessionId}/beliefs?key=${apiKey}`
      )
      if (beliefsResp.ok) {
        const data = await beliefsResp.json()
        const docs = data.documents || []
        // Match by order_index or position
        const targetDoc = docs[i] || docs.find(d =>
          d.fields?.belief?.stringValue === node.belief
        )
        if (targetDoc) {
          const docName = targetDoc.name.split('/documents/')[1]
          // Update illustration_url and other enriched fields
          const updateFields = {
            illustration_url: { stringValue: illustrationUrl },
            written_analysis: { stringValue: node.written_analysis || '' },
            narration_script: { stringValue: node.narration_script || '' },
            illustration_prompt: { stringValue: node.illustration_prompt || '' },
          }
          await fetch(
            `${firestoreBase}/${docName}?key=${apiKey}&updateMask.fieldPaths=illustration_url&updateMask.fieldPaths=written_analysis&updateMask.fieldPaths=narration_script&updateMask.fieldPaths=illustration_prompt`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fields: updateFields }),
            }
          )
        }
      }
    }

    // Update session status to generating_audio
    await fetch(
      `${firestoreBase}/users/${uid}/sessions/${sessionId}?key=${apiKey}&updateMask.fieldPaths=status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { status: { stringValue: 'generating_audio' } } }),
      }
    )

    // Generate narration script (concatenate all narration_scripts)
    const narrationScripts = nodes.map(n => n.narration_script).filter(Boolean)
    const fullNarration = (beliefTree.session_summary?.dominant_theme
      ? `The thread that runs through all your beliefs is this: ${beliefTree.session_summary.dominant_theme}. `
      : '') + narrationScripts.join(' ')

    // For local: store narration text in Firestore (no real TTS file generated)
    // In production: call Gemini Live API audio-out mode
    await fetch(
      `${firestoreBase}/users/${uid}/sessions/${sessionId}?key=${apiKey}&updateMask.fieldPaths=status&updateMask.fieldPaths=narration_text`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'generating_pdf' },
            narration_text: { stringValue: fullNarration },
          }
        }),
      }
    )

    // Trigger PDF generation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, sessionId, beliefTree }),
    }).catch(console.error)

    return NextResponse.json({ success: true, nodesProcessed: nodes.length })
  } catch (err) {
    console.error('[/api/generate-images]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
