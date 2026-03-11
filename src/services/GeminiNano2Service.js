/**
 * GeminiNano2Service.js
 * Image generation via Gemini API.
 * For local run, uses gemini-2.0-flash's image generation capability.
 * For production, swap with Vertex AI Imagen.
 */

async function generateBeliefIllustration(illustrationPrompt, apiKey) {
  // Use Gemini image generation endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`

  const fullPrompt = `${illustrationPrompt}. Style: painterly, moody, memory-like, cinematic lighting, deep shadows, evocative atmosphere. No people, no faces.`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    })

    if (!response.ok) {
      console.warn('[GeminiNano2] Image gen failed:', response.status)
      return null
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
      }
    }
    return null
  } catch (e) {
    console.error('[GeminiNano2] Error:', e)
    return null
  }
}

// Generate placeholder image as fallback (moody gradient SVG)
function generatePlaceholderImage(beliefText, index) {
  const colors = [
    ['#1a1a2e', '#16213e', '#0f3460'],
    ['#1a0a0a', '#2d0f0f', '#3d1515'],
    ['#0a1a0a', '#0f2d0f', '#153d15'],
    ['#1a1508', '#2d2206', '#3d3007'],
    ['#0d0a1a', '#1a1030', '#2a1545'],
  ]
  const [c1, c2, c3] = colors[index % colors.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
    <defs>
      <radialGradient id="g${index}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:${c2}"/>
        <stop offset="100%" style="stop-color:${c1}"/>
      </radialGradient>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feBlend in="SourceGraphic" mode="overlay"/>
      </filter>
    </defs>
    <rect width="800" height="450" fill="url(#g${index})"/>
    <rect width="800" height="450" fill="${c3}" opacity="0.3" filter="url(#noise)"/>
    <circle cx="400" cy="225" r="150" fill="${c3}" opacity="0.15"/>
    <circle cx="400" cy="225" r="80" fill="${c3}" opacity="0.2"/>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export { generateBeliefIllustration, generatePlaceholderImage }
