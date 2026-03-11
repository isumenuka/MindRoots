/**
 * GeminiNano2Service.js
 * Image generation via Gemini API.
 * For local run, uses gemini-3.1-flash-image-preview image generation capability.
 * For production, swap with Vertex AI Imagen.
 */
import { GoogleGenAI } from '@google/genai'

async function generateBeliefIllustration(illustrationPrompt, apiKey) {
  const fullPrompt = `${illustrationPrompt}. Style: painterly, moody, memory-like, cinematic lighting, deep shadows, evocative atmosphere. No people, no faces.`

  try {
    const ai = new GoogleGenAI({ apiKey })
    const interaction = await ai.interactions.create({
      model: 'gemini-3.1-flash-image-preview',
      input: fullPrompt
    })

    for (const output of interaction.outputs) {
      if (output.type === 'image' && output.data) {
        const mimeType = output.mimeType || 'image/jpeg'
        return `data:${mimeType};base64,${output.data}`
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
