#!/usr/bin/env python3
"""
MindRoots — Gemini Live API Backend
Provides configuration endpoints and ephemeral token generation.
"""

import os
import json
import datetime
from fastapi import FastAPI, HTTPException, Header  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from google import genai  # type: ignore
from dotenv import load_dotenv  # type: ignore

# ─── Config ────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in backend/.env")

ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "mindroots-admin-2025")

LIVE_MODEL = "gemini-2.0-flash-exp"

# ─── Live config (mutable — updated by admin dashboard) ──
live_config: dict = {
    "model": LIVE_MODEL,
    "voice": "Puck",
    "temperature": 1.0,
    "max_excavations": 5,
    "enable_affective_dialog": False,
    "enable_proactive_audio": False,
    "enable_google_grounding": False,
    "enable_input_transcription": True,
    "enable_output_transcription": True,
    "vad_start_sensitivity": "DEFAULT",   # DEFAULT | LOW | HIGH
    "vad_end_sensitivity": "DEFAULT",     # DEFAULT | LOW | HIGH
    "vad_silence_duration_ms": 2000,
    "vad_prefix_padding_ms": 500,
    "system_prompt": None,  # None = use SOCRATIC_SYSTEM_PROMPT default
}

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

# ─── Gemini client ──────────────────────────────────────────────────────────
client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options={"api_version": "v1alpha"},
)

# ─── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(title="MindRoots Backend")

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


class ConfigUpdate(BaseModel):
    model: Optional[str] = None
    voice: Optional[str] = None
    temperature: Optional[float] = None
    max_excavations: Optional[int] = None
    enable_affective_dialog: Optional[bool] = None
    enable_proactive_audio: Optional[bool] = None
    enable_google_grounding: Optional[bool] = None
    enable_input_transcription: Optional[bool] = None
    enable_output_transcription: Optional[bool] = None
    vad_start_sensitivity: Optional[str] = None
    vad_end_sensitivity: Optional[str] = None
    vad_silence_duration_ms: Optional[int] = None
    vad_prefix_padding_ms: Optional[int] = None
    system_prompt: Optional[str] = None


@app.get("/api/config")
async def get_config():
    """Return current live config."""
    return {**live_config, "default_system_prompt": SOCRATIC_SYSTEM_PROMPT[:200] + "..."}


@app.post("/api/config")
async def update_config(
    update: ConfigUpdate,
    x_admin_secret: Optional[str] = Header(default=None),
):
    """Update live config."""
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    updated = {}
    for field, value in update.model_dump(exclude_none=True).items():
        live_config[field] = value
        updated[field] = value

    print(f"[Admin] Config updated: {list(updated.keys())}")
    return {"ok": True, "updated": updated, "config": live_config}


@app.post("/api/token")
async def get_ephemeral_token():
    """Generates an ephemeral token for the Gemini Live API."""
    try:
        now = datetime.datetime.now(tz=datetime.timezone.utc)
        expire_time = now + datetime.timedelta(minutes=30)
        
        token = client.auth_tokens.create(
            config={
                "uses": 10, # Allow some reconnection leeway
                "expire_time": expire_time.isoformat(),
                "new_session_expire_time": (now + datetime.timedelta(minutes=5)).isoformat(),
                "http_options": {"api_version": "v1alpha"},
            }
        )

        return {
            "token": token.name,
            "expires_at": expire_time.isoformat()
        }
    except Exception as e:
        print(f"Error generating ephemeral token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


import asyncio
import base64
import json
from fastapi import WebSocket, WebSocketDisconnect # type: ignore
from google.genai import types # type: ignore

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Client connected")

    # Construct the Live endpoint configuration based on admin settings
    config = types.LiveConnectConfig(
        response_modalities=[types.Modality.AUDIO],
        system_instruction=types.Content(
            parts=[types.Part(text=live_config.get("system_prompt") or SOCRATIC_SYSTEM_PROMPT)]
        ),
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name=live_config.get("voice", "Puck")
                )
            )
        )
    )
    
    try:
        async with client.aio.live.connect(model=live_config["model"], config=config) as session:
            print("[WS] Gemini session established")
            
            async def receive_from_browser():
                """Listen to the browser's WebSocket and forward to Gemini."""
                try:
                    while True:
                        data = await websocket.receive_text()
                        msg = json.loads(data)
                        
                        # Audio input
                        if "audio" in msg:
                            audio_b64 = msg["audio"]
                            audio_bytes = base64.b64decode(audio_b64)
                            await session.send_realtime_input(
                                audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
                            )
                        # Text input
                        elif "text" in msg:
                            await session.send_realtime_input(text=msg["text"])
                        # End of mic utterance (client sent end of stream)
                        elif "audioStreamEnd" in msg:
                            # Not strictly required but good for flushing if we needed it. No native counterpart in python SDK for flush explicitly
                            pass
                except WebSocketDisconnect:
                    print("[WS] Browser disconnected")
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    print(f"[WS] Error receiving from browser: {e}")

            async def receive_from_gemini():
                """Listen to Gemini and forward back to the browser's WebSocket."""
                try:
                    async for response in session.receive():
                        server_content = response.server_content
                        if not server_content:
                            continue
                            
                        # Extract audio data
                        if server_content.model_turn:
                            for part in server_content.model_turn.parts:
                                if part.inline_data:
                                    audio_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                                    await websocket.send_json({
                                        "type": "audio",
                                        "data": audio_b64
                                    })
                                    
                        # Extract transcriptions
                        if server_content.input_transcription:
                            await websocket.send_json({
                                "type": "transcript",
                                "role": "user",
                                "text": server_content.input_transcription.text
                            })
                            
                        if server_content.output_transcription:
                            await websocket.send_json({
                                "type": "transcript",
                                "role": "assistant",
                                "text": server_content.output_transcription.text
                            })
                            
                        # Extract interruption events
                        if server_content.interrupted:
                            await websocket.send_json({"type": "interrupted"})
                            
                        # Extract turn complete events
                        if server_content.turn_complete:
                            await websocket.send_json({"type": "turnComplete"})
                            
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    print(f"[WS] Error receiving from Gemini: {e}")
                    try:
                        await websocket.send_json({"type": "error", "message": f"Gemini Error: {e}"})
                    except:
                        pass

            # Run both loops simultaneously
            t1 = asyncio.create_task(receive_from_browser())
            t2 = asyncio.create_task(receive_from_gemini())
            
            done, pending = await asyncio.wait([t1, t2], return_when=asyncio.FIRST_COMPLETED)
            
            # Cancel the remaining task
            for task in pending:
                task.cancel()
                
    except Exception as e:
        print(f"[WS] Failed to connect to Gemini: {e}")
        try:
            await websocket.send_json({"type": "error", "message": f"Connection failed: {e}"})
        except:
            pass
    finally:
        print("[WS] Connection closed")
        try:
            await websocket.close()
        except:
            pass


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn  # type: ignore
    print("""
╔══════════════════════════════════════════════════════╗
║     MindRoots — Backend API                          ║
╠══════════════════════════════════════════════════════╣
║  🔑  POST /api/token  →  Ephemeral Token             ║
║  ⚙️  GET  /api/config →  Admin Config                ║
║  ❤️  GET  /health     →  Health Check                ║
║                                                      ║
║  Running on: http://localhost:8000                   ║
║  Start Next.js separately: npm run dev               ║
╚══════════════════════════════════════════════════════╝
""")
    uvicorn.run(app, host="0.0.0.0", port=8000)

