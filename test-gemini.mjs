import { GoogleGenAI } from '@google/genai';

const apiKey = "AIzaSyDFlHcamGJ3_RNRRzQHtapWbjzEVDYzjSc";

const ai = new GoogleGenAI({ apiKey });
const FLASH_MODEL = 'gemini-2.5-flash';
console.log('Starting gemini test...');
(async () => {
try {
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    config: {
      systemInstruction: { parts: [{ text: "You are a structurer." }] },
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
    contents: "Test."
  })
  console.log('Success 1:', response.text);
} catch (e) {
  console.log('Error 1:', e.message);
  
  // Try string format
  try {
    const response2 = await ai.models.generateContent({
      model: FLASH_MODEL,
      config: {
        systemInstruction: "You are a structurer.",
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
      contents: "Test."
    })
    console.log('Success 2:', response2.text);
  } catch (e2) {
    console.log('Error 2:', e2.message);
  }
}
})();
