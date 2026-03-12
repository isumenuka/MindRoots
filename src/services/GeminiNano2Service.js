/**
 * GeminiNano2Service.js
 * Image generation with "MindRoots Visual Language":
 *   — Dark symbolic art, NOT realistic photography
 *   — Glowing neural roots, ink-wash consciousness maps
 *   — Isometric memory architecture, flooded interiors
 *   — Rich SVG fallbacks that feel like the MindRoots brand
 */
import { GoogleGenAI } from '@google/genai'

// ── Prompt wrapper: enforce MindRoots brand style ─────────────────────────────
const MINDROOTS_STYLE = `
Art direction: MindRoots Belief Archaeology visual system.
Style: dark symbolic art, NOT photography, NOT realistic.
Use one of these visual languages:
— Biopunk / neural-root illustration: glowing indigo roots growing through cracked dark walls, 
  bioluminescent filaments threading through architecture, deep space darkness
— Isometric memory crystals: geometric memory chambers floating in dark void, 
  indigo and violet light leaking through cracks, structural ruins of the mind
— Dark ink-wash consciousness map: black ink diffusion on dark paper, single glowing 
  geometric symbol in the center, negative space, abstract depth
— Flooded interior architecture: a room submerged in dark water, single beam of violet 
  light cutting through murky depth, symbolic objects floating mid-frame
Color palette strictly: near-black backgrounds (#070a10), indigo highlights (#818CF8), 
deep violet (#6366f1), muted amber (#fbbf24) traces only.
No people, no faces, no text, no UI elements.
Ultra dark, moody, psychologically evocative.
Render as: dramatic digital illustration, 16:9, cinematic.
`

async function generateBeliefIllustration(illustrationPrompt, apiKey) {
  const fullPrompt = `${illustrationPrompt}.\n${MINDROOTS_STYLE}`

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: fullPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/jpeg'
        return `data:${mimeType};base64,${part.inlineData.data}`
      }
    }
    return null
  } catch (e) {
    console.error('[GeminiNano2] Error:', e)
    return null
  }
}

// ── Rich SVG fallbacks — each one is unique to the belief's emotional weight ─
function generatePlaceholderImage(beliefText, index) {
  const id = `mr_${index}_${Date.now()}`

  // 5 distinct MindRoots visual patterns
  const patterns = [
    // 0: Neural root burst from center
    (id) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <radialGradient id="bg${id}" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#0f1030"/>
          <stop offset="100%" stop-color="#070a10"/>
        </radialGradient>
        <radialGradient id="glow${id}" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stop-color="#818CF8" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#818CF8" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur${id}"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <rect width="800" height="450" fill="url(#bg${id})"/>
      <ellipse cx="400" cy="225" rx="200" ry="120" fill="url(#glow${id})" filter="url(#blur${id})"/>
      ${Array.from({length:12},(_,i)=>{
        const a=(i/12)*Math.PI*2,d=80+Math.random()*120,x=400+Math.cos(a)*d,y=225+Math.sin(a)*d*0.6
        const x2=400+Math.cos(a)*(d+60+Math.random()*80),y2=225+Math.sin(a)*(d+40)*0.6
        const op=(0.3+Math.random()*0.6).toFixed(2)
        return `<line x1="400" y1="225" x2="${x.toFixed(0)}" y2="${y.toFixed(0)}" stroke="#818CF8" stroke-width="${(0.5+Math.random()*2).toFixed(1)}" stroke-opacity="${op}"/>
        <line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="#6366f1" stroke-width="${(0.3+Math.random()).toFixed(1)}" stroke-opacity="${(op*0.6).toFixed(2)}"/>`
      }).join('')}
      <circle cx="400" cy="225" r="8" fill="#818CF8" opacity="0.9"/>
      <circle cx="400" cy="225" r="20" fill="none" stroke="#818CF8" stroke-width="0.5" opacity="0.4"/>
      <circle cx="400" cy="225" r="50" fill="none" stroke="#6366f1" stroke-width="0.3" opacity="0.2"/>
    </svg>`,

    // 1: Cracked memory vault — geometric with indigo leak
    (id) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="bg${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#070a10"/>
          <stop offset="100%" stop-color="#0d0f1a"/>
        </linearGradient>
        <linearGradient id="crack${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#818CF8" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#4f46e5" stop-opacity="0"/>
        </linearGradient>
        <filter id="glow${id}"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="800" height="450" fill="url(#bg${id})"/>
      <!-- Isometric base shape -->
      <polygon points="400,80 580,180 580,320 400,420 220,320 220,180" fill="none" stroke="#1e2040" stroke-width="1" opacity="0.8"/>
      <polygon points="400,110 555,200 555,300 400,390 245,300 245,200" fill="none" stroke="#1e2040" stroke-width="0.5" opacity="0.5"/>
      <!-- Crack lines glowing -->
      <path d="M400,80 L380,200 L420,280 L390,420" fill="none" stroke="url(#crack${id})" stroke-width="2" filter="url(#glow${id})"/>
      <path d="M400,80 L430,160 L410,260 L440,380" fill="none" stroke="#6366f1" stroke-width="1" opacity="0.5"/>
      <path d="M220,180 L310,225 L350,280" fill="none" stroke="#818CF8" stroke-width="1.5" opacity="0.4" filter="url(#glow${id})"/>
      <path d="M580,180 L490,225 L450,280" fill="none" stroke="#818CF8" stroke-width="1.5" opacity="0.4" filter="url(#glow${id})"/>
      <!-- Center crystal -->
      <polygon points="400,200 420,225 400,250 380,225" fill="#0f1030" stroke="#818CF8" stroke-width="1" opacity="0.9" filter="url(#glow${id})"/>
      <polygon points="400,210 412,225 400,240 388,225" fill="#818CF8" opacity="0.3" filter="url(#glow${id})"/>
    </svg>`,

    // 2: Dark ink wash with glowing eye symbol
    (id) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <radialGradient id="bg${id}" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#0a0a14"/>
          <stop offset="50%" stop-color="#070a10"/>
          <stop offset="100%" stop-color="#040608"/>
        </radialGradient>
        <radialGradient id="iris${id}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#818CF8"/>
          <stop offset="60%" stop-color="#4f46e5"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </radialGradient>
        <filter id="blur${id}"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="800" height="450" fill="url(#bg${id})"/>
      <!-- Ink wash circles — diffusion -->
      ${[180,150,120,90,60,30].map((r,i)=>`<circle cx="400" cy="225" r="${r}" fill="none" stroke="#818CF8" stroke-width="${(0.2+i*0.15).toFixed(2)}" opacity="${(0.05+(5-i)*0.03).toFixed(2)}"/>`).join('')}
      <!-- Eye shape -->
      <path d="M250,225 Q400,130 550,225 Q400,320 250,225Z" fill="#0a0a1a" stroke="#818CF8" stroke-width="1" opacity="0.6"/>
      <ellipse cx="400" cy="225" rx="50" ry="50" fill="url(#iris${id})" opacity="0.7"/>
      <circle cx="400" cy="225" r="20" fill="#0a0a1a"/>
      <circle cx="400" cy="225" r="4" fill="#818CF8" opacity="0.9"/>
      <!-- Radial lines from eye -->
      ${Array.from({length:32},(_,i)=>{const a=(i/32)*Math.PI*2;return`<line x1="${(400+Math.cos(a)*50).toFixed(0)}" y1="${(225+Math.sin(a)*50).toFixed(0)}" x2="${(400+Math.cos(a)*220).toFixed(0)}" y2="${(225+Math.sin(a)*160).toFixed(0)}" stroke="#818CF8" stroke-width="0.3" opacity="${(0.03+Math.random()*0.08).toFixed(2)}"/>`}).join('')}
    </svg>`,

    // 3: Flooded room / submerged memory
    (id) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="water${id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0a1020" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#05080f"/>
        </linearGradient>
        <linearGradient id="light${id}" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#818CF8" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#818CF8" stop-opacity="0"/>
        </linearGradient>
        <filter id="ripple${id}">
          <feTurbulence type="turbulence" baseFrequency="0.01 0.05" numOctaves="2" seed="2"/>
          <feDisplacementMap in="SourceGraphic" scale="6" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <rect width="800" height="450" fill="#070a10"/>
      <!-- Room perspective lines -->
      <line x1="400" y1="0" x2="100" y2="450" stroke="#1a1f35" stroke-width="0.5"/>
      <line x1="400" y1="0" x2="700" y2="450" stroke="#1a1f35" stroke-width="0.5"/>
      <line x1="400" y1="0" x2="400" y2="450" stroke="#1a1f35" stroke-width="0.3"/>
      <line x1="0" y1="300" x2="800" y2="300" stroke="#1a1f35" stroke-width="0.5"/>
      <!-- Light beam -->
      <polygon points="360,0 440,0 520,450 280,450" fill="url(#light${id})" opacity="0.3"/>
      <!-- Water surface -->
      <rect x="0" y="280" width="800" height="170" fill="url(#water${id})" filter="url(#ripple${id})"/>
      <!-- Floating memory objects — abstract -->
      <rect x="340" y="290" width="40" height="30" fill="none" stroke="#818CF8" stroke-width="0.5" opacity="0.4" transform="rotate(-5,360,305)"/>
      <circle cx="250" cy="320" r="15" fill="none" stroke="#6366f1" stroke-width="0.5" opacity="0.3"/>
      <line x1="150" y1="340" x2="650" y2="340" stroke="#818CF8" stroke-width="0.3" opacity="0.15" filter="url(#ripple${id})"/>
      <!-- Reflection glow -->
      <ellipse cx="400" cy="290" rx="60" ry="10" fill="#818CF8" opacity="0.08" filter="url(#ripple${id})"/>
    </svg>`,

    // 4: DNA helix / belief strand ascending
    (id) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="bg${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06070f"/>
          <stop offset="100%" stop-color="#0d0a1a"/>
        </linearGradient>
        <filter id="glow${id}"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="800" height="450" fill="url(#bg${id})"/>
      <!-- Helix strands -->
      ${Array.from({length:20},(_,i)=>{
        const t=i/19,x1=300+Math.sin(t*Math.PI*4)*120,x2=500+Math.sin(t*Math.PI*4+Math.PI)*120,y=50+t*350
        const op=(0.4+Math.sin(t*Math.PI*4)*0.3).toFixed(2)
        return `<line x1="${x1.toFixed(0)}" y1="${y.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y.toFixed(0)}" stroke="#818CF8" stroke-width="0.8" stroke-opacity="${op}"/>
        <circle cx="${x1.toFixed(0)}" cy="${y.toFixed(0)}" r="4" fill="#818CF8" opacity="${op}" filter="url(#glow${id})"/>
        <circle cx="${x2.toFixed(0)}" cy="${y.toFixed(0)}" r="4" fill="#6366f1" opacity="${op}" filter="url(#glow${id})"/>`
      }).join('')}
      <!-- Backbone curves -->
      <path d="M300,50 ${Array.from({length:20},(_,i)=>{const t=i/19,x=300+Math.sin(t*Math.PI*4)*120,y=50+t*350;return`L${x.toFixed(0)},${y.toFixed(0)}`}).join(' ')}" fill="none" stroke="#4f46e5" stroke-width="1.5" opacity="0.6" filter="url(#glow${id})"/>
      <path d="M500,50 ${Array.from({length:20},(_,i)=>{const t=i/19,x=500+Math.sin(t*Math.PI*4+Math.PI)*120,y=50+t*350;return`L${x.toFixed(0)},${y.toFixed(0)}`}).join(' ')}" fill="none" stroke="#818CF8" stroke-width="1.5" opacity="0.6" filter="url(#glow${id})"/>
    </svg>`,
  ]

  try {
    const svgContent = patterns[index % patterns.length](id)
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`
  } catch (e) {
    // Ultra-safe fallback
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#070a10"/><circle cx="400" cy="225" r="80" fill="none" stroke="#818CF8" stroke-width="1" opacity="0.5"/></svg>`
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }
}

export { generateBeliefIllustration, generatePlaceholderImage }
