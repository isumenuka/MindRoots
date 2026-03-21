/**
 * PdfService.js
 * Generates a Belief Origin Tree PDF via the backend /api/generate-pdf endpoint.
 * Uses the pdf skill (reportlab) running server-side — no browser rendering needed.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/**
 * Generate a Belief Origin Tree PDF.
 * @param {object} beliefTree - Full structured belief tree from GeminiFlashService
 * @returns {Uint8Array} Raw PDF bytes ready for upload or download
 */
export default async function generateBeliefPdf(beliefTree) {
  const res = await fetch(`${BACKEND_URL}/api/generate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ beliefTree }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`PDF generation failed (${res.status}): ${err}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}
