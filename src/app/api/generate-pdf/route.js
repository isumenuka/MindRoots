import { NextResponse } from 'next/server'
import { getAdminDb } from '@/services/FirebaseAdminService'

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

    const db = getAdminDb()

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
    await db.doc(`users/${uid}/sessions/${sessionId}`).update({ status: 'complete' })
    console.log('[generate-pdf] Status → complete')

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
      try {
        const db = getAdminDb()
        await db.doc(`users/${uid}/sessions/${sessionId}`).update({ status: 'complete' })
      } catch {}
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
