const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const key = env.split('\n').find(l => l.startsWith('GEMINI_API_KEY'))?.split('=')[1]?.trim();
process.env.GEMINI_API_KEY = key;
const { GoogleGenAI } = require('@google/genai');

async function test(modelName) {
  console.log(`\nTesting connection to: ${modelName}`);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const session = await ai.live.connect({ 
      model: modelName,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        },
        systemInstruction: {
          parts: [{ text: "You are a test." }]
        },
      }
    });
    console.log(`Success! Connected to ${modelName}`);
    session.close();
  } catch (e) {
    console.log(`Failed for ${modelName}:`, e.message);
  }
}

(async () => {
  await test('models/gemini-2.0-flash');
  await test('models/gemini-2.0-flash-lite');
  await test('models/gemini-2.0-flash-exp');
  await test('gemini-2.0-flash-live-001');
  await test('models/gemini-2.0-pro-exp-02-05');
  process.exit(0);
})();
