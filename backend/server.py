#!/usr/bin/env python3
"""
MindRoots — Gemini Live WebSocket Proxy
All Gemini Live API communication happens in Python.
The browser just sends/receives audio & messages over a simple WebSocket.
"""

import asyncio
import base64
import json
import os
import re

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from google import genai  # type: ignore
from google.genai import types  # type: ignore
from dotenv import load_dotenv  # type: ignore

# ─── Config ────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in backend/.env")

ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "mindroots-admin-2025")

# Use a stable known model for Live API bidi generation
LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
COMPLETION_PHRASE = "your belief map is now being drawn"

# ─── Live config (mutable — updated by admin dashboard, no restart needed) ──
live_config: dict = {
    "model": LIVE_MODEL,
    "voice": "Puck",
    "temperature": 1.0,
    "max_excavations": 5,
    "enable_affective_dialog": True,
    "enable_proactive_audio": True,
    "enable_google_grounding": False,
    "enable_input_transcription": True,
    "enable_output_transcription": True,
    "vad_start_sensitivity": "DEFAULT",   # DEFAULT | LOW | HIGH
    "vad_end_sensitivity": "DEFAULT",     # DEFAULT | LOW | HIGH
    "vad_silence_duration_ms": 500,
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


# ─── Admin config endpoints ─────────────────────────────────────────────────
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


# ─── Admin REST endpoints ────────────────────────────────────────────────────
@app.get("/api/config")
async def get_config():
    """Return current live config (admin dashboard reads this on load)."""
    return {**live_config, "default_system_prompt": SOCRATIC_SYSTEM_PROMPT[:200] + "..."}


@app.post("/api/config")
async def update_config(
    update: ConfigUpdate,
    x_admin_secret: Optional[str] = Header(default=None),
):
    """Update live config. Requires X-Admin-Secret header matching ADMIN_SECRET env var."""
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    updated = {}
    for field, value in update.model_dump(exclude_none=True).items():
        live_config[field] = value
        updated[field] = value

    print(f"[Admin] Config updated: {list(updated.keys())}")
    return {"ok": True, "updated": updated, "config": live_config}


# ─── WebSocket endpoint ─────────────────────────────────────────────────────
@app.websocket("/ws")
async def gemini_live_proxy(ws: WebSocket):
    await ws.accept()
    print("[Proxy] Browser connected")
    # Snapshot config at connection time
    cfg = dict(live_config)
    system_prompt_text = cfg.get("system_prompt") or SOCRATIC_SYSTEM_PROMPT

    start_str = cfg.get("vad_start_sensitivity", "DEFAULT")
    end_str = cfg.get("vad_end_sensitivity", "DEFAULT")

    if start_str == "LOW":
        start_sens = types.StartSensitivity.START_SENSITIVITY_LOW
    elif start_str == "HIGH":
        start_sens = types.StartSensitivity.START_SENSITIVITY_HIGH
    else:
        start_sens = types.StartSensitivity.START_SENSITIVITY_UNSPECIFIED

    if end_str == "LOW":
        end_sens = types.EndSensitivity.END_SENSITIVITY_LOW
    elif end_str == "HIGH":
        end_sens = types.EndSensitivity.END_SENSITIVITY_HIGH
    else:
        end_sens = types.EndSensitivity.END_SENSITIVITY_UNSPECIFIED

    tools = []
    if cfg.get("enable_google_grounding"):
        tools.append(types.Tool(google_search=types.GoogleSearch()))  # type: ignore

    session_config = types.LiveConnectConfig( # type: ignore
        response_modalities=[types.LiveOutputModality.AUDIO], # type: ignore
        system_instruction=types.Content(
            parts=[types.Part(text=system_prompt_text)]
        ),
        tools=tools if tools else None,
        speech_config=types.SpeechConfig( # type: ignore
            voice_config=types.VoiceConfig( # type: ignore
                prebuilt_voice_config=types.PrebuiltVoiceConfig( # type: ignore
                    voice_name=cfg.get("voice", "Kore")
                )
            )
        ),
        input_audio_transcription=types.AudioTranscriptionConfig() if cfg.get("enable_input_transcription", True) else None, # type: ignore
        output_audio_transcription=types.AudioTranscriptionConfig() if cfg.get("enable_output_transcription", True) else None, # type: ignore
        enable_affective_dialog=cfg.get("enable_affective_dialog", True),
        proactivity=types.ProactivityConfig( # type: ignore
            proactive_audio=cfg.get("enable_proactive_audio", True)
        ),
        realtime_input_config=types.RealtimeInputConfig( # type: ignore
            automatic_activity_detection=types.AutomaticActivityDetection( # type: ignore
                start_of_speech_sensitivity=start_sens,
                end_of_speech_sensitivity=end_sens,
                silence_duration_ms=cfg.get("vad_silence_duration_ms", 500),
                prefix_padding_ms=cfg.get("vad_prefix_padding_ms", 500),
            )
        ),
    )

    try:
        async with client.aio.live.connect(
            model=cfg.get("model", LIVE_MODEL), config=session_config
        ) as gemini_session:

            print("[Proxy] Gemini Live session opened")
            await send_json(ws, {"type": "ready"})

            # ── Receive Gemini responses and forward to browser ──────────
            async def receive_from_gemini():
                async for response in gemini_session.receive():
                    # Debug: print the raw response type
                    print(f"[Gemini] Response: {type(response).__name__}")

                    # ── Path 1: server_content (most common) ──────────────
                    sc = getattr(response, "server_content", None)
                    if sc is not None:
                        # Interruption
                        if getattr(sc, "interrupted", False):
                            print("[Gemini] Interrupted")
                            await send_json(ws, {"type": "interrupted"})

                        # Turn complete
                        if getattr(sc, "turn_complete", False):
                            print("[Gemini] Turn complete")
                            await send_json(ws, {"type": "turn_complete"})

                        # Audio from model_turn parts
                        if getattr(sc, "model_turn", None) and getattr(sc.model_turn, "parts", None):  # type: ignore
                            for part in sc.model_turn.parts:  # type: ignore
                                print(f"[Gemini] Part type: {type(part).__name__}, has inline_data: {getattr(part, 'inline_data', None) is not None}")
                                if getattr(part, "inline_data", None):
                                    mime = part.inline_data.mime_type or ""  # type: ignore
                                    data = part.inline_data.data  # type: ignore
                                    print(f"[Gemini] Audio mime={mime} bytes={len(data) if data else 0}")
                                    if data and (mime.startswith("audio/") or not mime):
                                        audio_b64 = base64.b64encode(data).decode()
                                        await send_json(ws, {"type": "audio", "data": audio_b64})

                        # Input (user) transcript
                        if getattr(sc, "input_transcription", None) and getattr(sc.input_transcription, "text", None):  # type: ignore
                            text = sc.input_transcription.text  # type: ignore
                            print(f"[Gemini] User transcript: {text[:80]}")
                            await send_json(ws, {"type": "transcript", "role": "user", "text": text})

                        # Output (assistant) transcript
                        if getattr(sc, "output_transcription", None) and getattr(sc.output_transcription, "text", None):  # type: ignore
                            text = sc.output_transcription.text  # type: ignore
                            print(f"[Gemini] AI transcript: {text[:80]}")
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

                    # ── Path 2: top-level data (some SDK versions use this) ──
                    elif hasattr(response, "data") and response.data:  # type: ignore
                        data = response.data  # type: ignore
                        print(f"[Gemini] Top-level audio bytes={len(data)}")
                        audio_b64 = base64.b64encode(data).decode()
                        await send_json(ws, {"type": "audio", "data": audio_b64})

                    else:
                        print(f"[Gemini] Unknown response structure: {response}")

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

            # ── Run both relay loops as independent tasks ─────────────────
            # create_task = truly concurrent (not co-routine chained like gather)
            gemini_task  = asyncio.create_task(receive_from_gemini())
            browser_task = asyncio.create_task(receive_from_browser())

            # Wait for whichever ends first, then cancel the other
            done, pending = await asyncio.wait(
                [gemini_task, browser_task],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

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
    import uvicorn  # type: ignore
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
