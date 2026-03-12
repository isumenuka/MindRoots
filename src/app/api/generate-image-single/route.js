import { NextResponse } from 'next/server'
import { generateBeliefIllustration, generatePlaceholderImage } from '@/services/GeminiNano2Service'

/**
 * POST /api/generate-image-single
 * Body: { illustrationPrompt, beliefText, index }
 * Returns: { illustrationUrl }
 */
export async function POST(request) {
  try {
    const { illustrationPrompt, beliefText, index } = await request.json()
    const apiKey = process.env.GEMINI_API_KEY

    let illustrationUrl = null

    if (illustrationPrompt) {
      try {
        illustrationUrl = await generateBeliefIllustration(illustrationPrompt, apiKey)
      } catch (e) {
        console.warn('[generate-image-single] Gemini failed:', e.message)
      }
    }

    // Always fall back to rich SVG gradient
    if (!illustrationUrl) {
      illustrationUrl = generatePlaceholderImage(beliefText || 'belief', index || 0)
    }

    return NextResponse.json({ illustrationUrl })
  } catch (err) {
    console.error('[/api/generate-image-single]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
