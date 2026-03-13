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

LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"

# ─── Live config (mutable — updated by admin dashboard) ──
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
    "system_prompt": None,  # None = use instructions.md dynamically
}

def get_system_prompt() -> str:
    """Reads instructions from instructions.md or returns a default fallback."""
    instructions_path = os.path.join(os.path.dirname(__file__), "instructions.md")
    if os.path.exists(instructions_path):
        try:
            with open(instructions_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    return str(content)
        except Exception as e:
            print(f"Error reading instructions file: {e}")
    return "You are a helpful assistant. Be concise and friendly."


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
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
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
    config_out = dict(live_config)
    # If system_prompt hasn't been set by admin, or if it matches the fallback, read it from file
    prompt_str = str(get_system_prompt())
    if not config_out.get("system_prompt"):
        config_out["system_prompt"] = prompt_str
    
    config_out["default_system_prompt"] = f"{prompt_str:.200}..."
    return config_out


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

