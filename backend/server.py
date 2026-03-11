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

