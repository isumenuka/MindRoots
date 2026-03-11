import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { uid, sessionId, beliefTree } = await request.json()
    if (!uid || !sessionId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mindroots'
    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
    const apiKey = process.env.GEMINI_API_KEY

    // For local run: generate a simple PDF using React-PDF
    // We dynamically import to avoid SSR issues
    const { default: generateBeliefPdf } = await import('@/services/PdfService')
    const pdfBytes = await generateBeliefPdf(beliefTree)

    // In production: upload to GCS and save URL to Firestore
    // Locally: update session status to 'complete' and return bytes directly

    // Update session status to complete
    await fetch(
      `${firestoreBase}/users/${uid}/sessions/${sessionId}?key=${apiKey}&updateMask.fieldPaths=status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { status: { stringValue: 'complete' } } }),
      }
    )

    // Return PDF bytes as response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="mindroots-${sessionId.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[/api/generate-pdf]', err)
    // Still mark as complete even if PDF generation fails
    const { uid, sessionId } = await request.json().catch(() => ({}))
    if (uid && sessionId) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mindroots'
      const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
      const apiKey = process.env.GEMINI_API_KEY
      await fetch(
        `${firestoreBase}/users/${uid}/sessions/${sessionId}?key=${apiKey}&updateMask.fieldPaths=status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { status: { stringValue: 'complete' } } }),
        }
      ).catch(() => {})
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
