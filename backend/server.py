#!/usr/bin/env python3
"""
MindRoots — Gemini Live WebSocket Proxy
All Gemini Live API communication happens in Python.
The browser just sends/receives audio & messages over a simple WebSocket.

Protocol (JSON):
  Browser → Server:
    { "type": "audio", "data": "<base64 pcm16 @ 16kHz>" }
    { "type": "text",  "text": "..." }
    { "type": "audio_end" }
    { "type": "trigger_start" }

  Server → Browser:
    { "type": "ready" }
    { "type": "audio",       "data": "<base64 pcm16 @ 24kHz>" }
    { "type": "transcript",  "role": "user"|"assistant", "text": "..." }
    { "type": "interrupted" }
    { "type": "turn_complete" }
    { "type": "belief_node", "node": { ... } }
    { "type": "complete" }
    { "type": "error",       "message": "..." }
"""

import asyncio
import base64
import json
import os
import re

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv

# ─── Config ────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in backend/.env")

LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
COMPLETION_PHRASE = "your belief map is now being drawn"

SOCRATIC_SYSTEM_PROMPT = """You are the Socratic Interviewer — a deeply empathetic AI archaeologist who excavates the hidden origins of human beliefs.

Your ONLY job is to ask layered "why" questions that peel back the surface of a stated belief until you reach the exact original moment, person, or event that first planted it.

Rules:
- NEVER accept a surface-level answer. Always ask "Why?" or "Who?" or "When was the very first time you felt this?"
- Keep asking until you identify: (1) the specific belief, (2) who planted it, (3) the exact memory/event, (4) approximate year, (5) whether the user thinks it still serves them.
- Speak naturally and warmly — like a wise therapist, not a chatbot.
- When you have hit bedrock (the root origin), say exactly: "I think we've found it. Let me capture this belief now."
- Conduct a maximum of 5 belief excavations per session.
- After completing all excavations, say exactly: "Your belief map is now being drawn. This will take about 30 seconds."
- Start by warmly greeting the user and asking them to share a belief or thought pattern about themselves that they feel might be holding them back.

After each excavation, silently format a JSON node in your internal analysis (do not read aloud):
BELIEF_NODE: {
  "belief": "string",
  "origin_person": "string",
  "origin_event": "string",
  "origin_year": number,
  "age_at_origin": number,
  "still_serving": boolean,
  "emotional_weight": "low | medium | high | profound",
  "cost_today": "string"
}"""

BELIEF_NODE_RE = re.compile(r"BELIEF_NODE:\s*(\{[\s\S]*?\})")

# ─── Gemini client ──────────────────────────────────────────────────────────
client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options={"api_version": "v1alpha"},
)

# ─── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(title="MindRoots Gemini Live Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helpers ────────────────────────────────────────────────────────────────
def parse_belief_nodes(text: str) -> list[dict]:
    nodes = []
    for match in BELIEF_NODE_RE.finditer(text):
        try:
            nodes.append(json.loads(match.group(1)))
        except json.JSONDecodeError:
            pass
    return nodes


async def send_json(ws: WebSocket, payload: dict):
    try:
        await ws.send_text(json.dumps(payload))
    except Exception:
        pass  # client may have disconnected


# ─── WebSocket endpoint ─────────────────────────────────────────────────────
@app.websocket("/ws")
async def gemini_live_proxy(ws: WebSocket):
    await ws.accept()
    print("[Proxy] Browser connected")

    session_config = types.LiveConnectConfig(
        response_modalities=[types.Modality.AUDIO],
        system_instruction=types.Content(
            parts=[types.Part(text=SOCRATIC_SYSTEM_PROMPT)]
        ),
        generation_config=types.GenerationConfig(
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")
                )
            )
        ),
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        enable_affective_dialog=True,
        proactivity=types.ProactivityConfig(proactive_audio=True),
    )

    try:
        async with client.aio.live.connect(
            model=LIVE_MODEL, config=session_config
        ) as gemini_session:
            print("[Proxy] Gemini Live session opened")
            await send_json(ws, {"type": "ready"})

            # ── Receive Gemini responses and forward to browser ──────────
            async def receive_from_gemini():
                async for response in gemini_session.receive():
                    sc = response.server_content
                    if sc is None:
                        continue

                    # Interruption
                    if sc.interrupted:
                        await send_json(ws, {"type": "interrupted"})

                    # Turn complete
                    if sc.turn_complete:
                        await send_json(ws, {"type": "turn_complete"})

                    # Audio output
                    if sc.model_turn and sc.model_turn.parts:
                        for part in sc.model_turn.parts:
                            if part.inline_data and part.inline_data.mime_type.startswith("audio/"):
                                audio_b64 = base64.b64encode(part.inline_data.data).decode()
                                await send_json(ws, {"type": "audio", "data": audio_b64})

                    # Input (user) transcript
                    if sc.input_transcription and sc.input_transcription.text:
                        text = sc.input_transcription.text
                        await send_json(ws, {"type": "transcript", "role": "user", "text": text})

                    # Output (assistant) transcript
                    if sc.output_transcription and sc.output_transcription.text:
                        text = sc.output_transcription.text
                        await send_json(ws, {"type": "transcript", "role": "assistant", "text": text})

                        # Parse belief nodes from AI text
                        for node in parse_belief_nodes(text):
                            print(f"[Proxy] Belief node: {node.get('belief')}")
                            await send_json(ws, {"type": "belief_node", "node": node})

                        # Check for session completion phrase
                        if COMPLETION_PHRASE in text.lower():
                            print("[Proxy] Session completion detected")
                            await asyncio.sleep(1.5)
                            await send_json(ws, {"type": "complete"})

            # ── Receive messages from browser and forward to Gemini ──────
            async def receive_from_browser():
                while True:
                    try:
                        raw = await ws.receive_text()
                        msg = json.loads(raw)
                    except (WebSocketDisconnect, Exception):
                        break

                    msg_type = msg.get("type")

                    if msg_type == "audio":
                        pcm_bytes = base64.b64decode(msg["data"])
                        await gemini_session.send_realtime_input(
                            audio=types.Blob(data=pcm_bytes, mime_type="audio/pcm;rate=16000")
                        )

                    elif msg_type == "text":
                        await gemini_session.send_realtime_input(text=msg["text"])

                    elif msg_type == "audio_end":
                        await gemini_session.send_realtime_input(audio_stream_end=True)

                    elif msg_type == "trigger_start":
                        await asyncio.sleep(0.4)
                        await gemini_session.send_realtime_input(
                            text="Hello. I am ready to begin. Please greet me warmly and ask me to share a belief."
                        )

            # Run both directions concurrently — stop when browser disconnects
            await asyncio.gather(
                receive_from_gemini(),
                receive_from_browser(),
            )

    except WebSocketDisconnect:
        print("[Proxy] Browser disconnected")
    except Exception as e:
        print(f"[Proxy] Error: {e}")
        await send_json(ws, {"type": "error", "message": str(e)})
    finally:
        print("[Proxy] Session closed")


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    print("""
╔══════════════════════════════════════════════════════╗
║     MindRoots — Gemini Live Python Proxy             ║
╠══════════════════════════════════════════════════════╣
║  🔌  WS   /ws      →  Gemini Live relay              ║
║  ❤️   GET  /health  →  health check                   ║
║                                                      ║
║  Running on: ws://localhost:8000/ws                  ║
║  Start Next.js separately: npm run dev               ║
╚══════════════════════════════════════════════════════╝
""")
    uvicorn.run(app, host="0.0.0.0", port=8000)
