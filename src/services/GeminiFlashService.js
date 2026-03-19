/**
 * GeminiFlashService.js
 * Uses Gemini 3.0 Flash for belief structuring (Agent 2).
 */
import { GoogleGenAI } from '@google/genai'

const FLASH_MODEL = 'gemini-2.0-flash'

const STRUCTURER_SYSTEM_PROMPT = `You are the Data Structurer. You receive raw belief node data extracted from a voice interview and produce a complete, validated Belief Origin Tree JSON graph.

For each belief node provided, enrich and structure it. Then produce a synthesized meta-analysis of all beliefs together.

Respond ONLY with valid JSON in this exact format — no markdown code fences, no extra text:
{
  "session_summary": {
    "total_beliefs_found": number,
    "oldest_belief_year": number,
    "dominant_theme": "string — one sentence describing the thread across all beliefs",
    "estimated_total_cost": "string — what all beliefs combined are costing the user",
    "overall_emotional_tone": "wounded | guarded | striving | liberated | conflicted"
  },
  "belief_nodes": [
    {
      "id": "belief_1",
      "parent_id": "string | null — id of a belief that birthed this one, if any",
      "belief": "string — the core limiting belief statement, written in first person",
      "origin_person": "string",
      "origin_event": "string",
      "origin_year": number,
      "age_at_origin": number,
      "still_serving": boolean,
      "emotional_weight": "low | medium | high | profound",
      "cost_today": "string",
      "illustration_prompt": "string — a detailed visual scene description for image generation. Describe the scene of the origin moment: setting, lighting, atmosphere, objects. Painterly, evocative, memory-like aesthetic. NO people or faces.",
      "written_analysis": "string — 3-4 sentences: what this belief is, where it came from, how it is limiting the user today, and one reframe question for them to consider",
      "narration_script": "string — 2-3 sentences to be read aloud in the final audio narration, written in second-person (you/your)"
    }
  ]
}`

async function structureBeliefs(rawBeliefNodes, apiKey) {
  const prompt = `Here are the raw belief nodes extracted from a voice interview session:\n\n${JSON.stringify(rawBeliefNodes, null, 2)}\n\nPlease structure these into a complete Belief Origin Tree JSON.`

  const ai = new GoogleGenAI({ apiKey })

  let text = ''
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      config: {
        systemInstruction: { parts: [{ text: STRUCTURER_SYSTEM_PROMPT }] },
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
      contents: prompt
    })
    
    // Find text output
    text = response.text || ''
  } catch (e) {
    throw new Error(`Gemini Flash error: ${e.message}`)
  }

  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('[GeminiFlash] Failed to parse JSON:', text)
    throw new Error('Failed to parse belief structure JSON')
  }
}

export { structureBeliefs }
