import { NextResponse } from 'next/server'

function firestoreBase() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
}
function firebaseKey() { return process.env.NEXT_PUBLIC_FIREBASE_API_KEY }

async function setStatus(uid, sessionId, status) {
  const key = firebaseKey()
  const base = firestoreBase()
  const res = await fetch(
    `${base}/users/${uid}/sessions/${sessionId}?key=${key}&updateMask.fieldPaths=status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { status: { stringValue: status } } }),
    }
  )
  if (!res.ok) console.error('[generate-pdf] setStatus failed:', res.status, await res.text())
  else console.log(`[generate-pdf] Status → ${status}`)
  return res.ok
}

export async function POST(request) {
  let uid, sessionId, beliefTree
  try {
    const body = await request.json()
    uid = body.uid
    sessionId = body.sessionId
    beliefTree = body.beliefTree || {}

    if (!uid || !sessionId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Generate PDF
    let pdfBytes = null
    try {
      const { default: generateBeliefPdf } = await import('@/services/PdfService')
      pdfBytes = await generateBeliefPdf(beliefTree)
      console.log('[generate-pdf] PDF generated successfully')
    } catch (pdfErr) {
      console.warn('[generate-pdf] PDF generation failed:', pdfErr.message)
    }

    // Always mark complete regardless of PDF success
    await setStatus(uid, sessionId, 'complete')

    if (pdfBytes) {
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="mindroots-${sessionId.slice(0, 8)}.pdf"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    return NextResponse.json({ success: true, pdfSkipped: true })
  } catch (err) {
    console.error('[/api/generate-pdf] FATAL:', err)
    if (uid && sessionId) {
      await setStatus(uid, sessionId, 'complete').catch(() => {})
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
