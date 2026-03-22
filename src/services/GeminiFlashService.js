/**
 * GeminiFlashService.js
 * Uses Gemini 3.0 Flash for belief structuring (Agent 2).
 */
import { GoogleGenAI } from '@google/genai'

const FLASH_MODEL = 'gemini-2.5-flash'

const STRUCTURER_SYSTEM_PROMPT = `You are the Data Structurer. You receive raw insight nodes extracted from a voice interview (which can be beliefs, personas, coping strategies, values, etc.) and produce a complete, validated Insight Origin JSON graph.

For each node provided, enrich and structure it. Then produce a synthesized meta-analysis of all insights together.

Respond ONLY with valid JSON in this exact format — no markdown code fences, no extra text:
{
  "session_summary": {
    "total_beliefs_found": number,
    "oldest_belief_year": number,
    "dominant_theme": "string — one sentence describing the thread across all insights",
    "estimated_total_cost": "string — what all insights combined are costing the user",
    "overall_emotional_tone": "wounded | guarded | striving | liberated | conflicted"
  },
  "belief_nodes": [
    {
      "id": "node_1",
      "node_type": "string — the type of node, e.g. BELIEF_NODE, CRITIC_PERSONA_NODE",
      "parent_id": "string | null — id of a node that birthed this one, if any",
      "belief": "string — the core statement, limit, persona, or pattern. This is the primary text of the insight, written in first person if applicable.",
      "origin_person": "string",
      "origin_event": "string",
      "origin_year": number,
      "age_at_origin": number,
      "still_serving": boolean,
      "emotional_weight": "low | medium | high | profound",
      "cost_today": "string",
      "illustration_prompt": "string — a detailed visual scene description for image generation. Describe the scene of the origin moment: setting, lighting, atmosphere, objects. Painterly, evocative, memory-like aesthetic. NO people or faces.",
      "written_analysis": "string — 3-4 sentences: what this insight is, where it came from, how it affects the user today, and one reframe question for them to consider",
      "narration_script": "string — 2-3 sentences to be read aloud in the final audio narration, written in second-person (you/your)"
    }
  ]
}`

async function structureBeliefs(rawBeliefNodes, apiKey) {
  const prompt = `Here are the raw insight nodes extracted from a voice interview session:\n\n${JSON.stringify(rawBeliefNodes, null, 2)}\n\nPlease structure these into a complete Insight Origin JSON graph.`

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
