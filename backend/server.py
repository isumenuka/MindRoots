#!/usr/bin/env python3
"""
MindRoots — Gemini Live API Backend
Provides configuration endpoints and ephemeral token generation.
"""

import io
import os
import json
import wave
import datetime
from fastapi import FastAPI, HTTPException, Header  # type: ignore
from fastapi.responses import StreamingResponse  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import Any, Optional
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from google import genai  # type: ignore
from dotenv import load_dotenv  # type: ignore

# ReportLab — PDF generation (pdf skill)
from reportlab.lib.pagesizes import A4  # type: ignore
from reportlab.lib.units import mm  # type: ignore
from reportlab.lib import colors  # type: ignore
from reportlab.platypus import (  # type: ignore
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, PageBreak, KeepTogether,
    Flowable, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle  # type: ignore
from reportlab.lib.enums import TA_LEFT, TA_CENTER  # type: ignore

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
    "youtube_video_url": "https://www.youtube.com/embed/ZvtMh5gN3YI?rel=0",
}

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.json")

def load_live_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved_config = json.load(f)
                live_config.update(saved_config)
                print(f"Loaded config from {CONFIG_FILE}")
        except Exception as e:
            print(f"Error loading config file: {e}")

load_live_config()


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
        "https://mindroots.web.app",
        "https://mindroots.firebaseapp.com",
        "https://mindroots-1093242443167.us-central1.run.app",
        os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TtsRequest(BaseModel):
    text: str
    voice: Optional[str] = "Puck"
    style: Optional[str] = None
    speed: Optional[float] = None
    pitch: Optional[float] = None


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
    youtube_video_url: Optional[str] = None
    system_prompt: Optional[str] = None


@app.get("/api/config")
async def get_config():
    """Return current live config."""
    config_out = dict(live_config)
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

    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(live_config, f, indent=4)
    except Exception as e:
        print(f"Error saving config file: {e}")

    print(f"[Admin] Config updated: {list(updated.keys())}")
    return {"ok": True, "updated": updated, "config": live_config}


class TokenRequest(BaseModel):
    api_key: Optional[str] = None


@app.post("/api/token")
async def get_ephemeral_token(req: TokenRequest = None):
    """Generates an ephemeral token for the Gemini Live API."""
    try:
        api_key = (req.api_key if req and req.api_key else None) or GEMINI_API_KEY
        if not api_key:
            raise HTTPException(status_code=400, detail="No Gemini API key available")

        request_client = genai.Client(
            api_key=api_key,
            http_options={"api_version": "v1alpha"},
        )

        now = datetime.datetime.now(tz=datetime.timezone.utc)
        expire_time = now + datetime.timedelta(minutes=30)

        token = request_client.auth_tokens.create(
            config={
                "uses": 10,
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


@app.post("/api/tts")
async def text_to_speech(req: TtsRequest):
    """
    Generate premium audio narration using Gemini 2.5 Flash Preview TTS.
    """
    try:
        if not req.text:
            raise HTTPException(status_code=400, detail="Text is required")

        prompt = req.text
        if req.style:
            prompt = f"(Director's Notes: {req.style})\n{req.text}"

        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=prompt,
            config={
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {
                        "prebuilt_voice_config": {
                            "voice_name": req.voice or "Puck"
                        }
                    }
                }
            }
        )

        audio_bytes = None
        if hasattr(response, 'candidates') and response.candidates:
            parts = response.candidates[0].content.parts
            for part in parts:
                if hasattr(part, 'inline_data') and part.inline_data.mime_type.startswith('audio'):
                    audio_bytes = part.inline_data.data
                    break
        
        if not audio_bytes and hasattr(response, 'audio'):
            audio_bytes = response.audio

        if not audio_bytes:
            print(f"[TTS] No audio in response: {response}")
            raise HTTPException(status_code=500, detail="Gemini failed to generate audio")

        # Wrap raw PCM bytes in a WAV header for browser playability
        wav_io = io.BytesIO()
        with wave.open(wav_io, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2) # 16-bit
            wav_file.setframerate(24000)
            wav_file.writeframes(audio_bytes)
        
        return StreamingResponse(
            io.BytesIO(wav_io.getvalue()),
            media_type="audio/wav",
            headers={"Content-Disposition": 'attachment; filename="narration.wav"'}
        )

    except Exception as e:
        print(f"[TTS] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── PDF Generation (pdf skill — reportlab) ────────────────────────────────

class PdfRequest(BaseModel):
    beliefTree: Any  # full belief tree JSON from GeminiFlashService


# MindRootsLogo flowable removed in favor of real image asset


def draw_background(canvas, doc):
    canvas.saveState()
    # Dark Mode Background (#0A0A0A)
    canvas.setFillColor(colors.HexColor("#0A0A0A"))
    canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], stroke=0, fill=1)
    
    # Subtle Page Numbers
    canvas.setFillColor(colors.HexColor("#374151")) # Dark gray
    canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(doc.pagesize[0]/2, 10*mm, f"PAGE {doc.page}")
    
    # Watermark (Rotated & Very Faint)
    canvas.translate(doc.pagesize[0] / 2, doc.pagesize[1] / 2)
    canvas.rotate(45)
    canvas.setFillColor(colors.Color(1, 1, 1, alpha=0.025))
    canvas.setFont("Helvetica-Bold", 72)
    canvas.drawCentredString(0, 0, "M I N D R O O T S")
    
    # Border
    canvas.restoreState()
    canvas.saveState()
    # Gradient-like thin border using purple/indigo (#818CF8)
    canvas.setStrokeColor(colors.Color(129/255, 140/255, 248/255, alpha=0.25))
    canvas.setLineWidth(0.5)
    margin = 8 * mm
    canvas.roundRect(margin, margin, doc.pagesize[0] - 2*margin, doc.pagesize[1] - 2*margin, 4)
    canvas.restoreState()


def _build_belief_pdf(belief_tree: dict) -> bytes:
    """Render a Belief Origin Tree PDF using reportlab."""
    buf = io.BytesIO()
    summary = belief_tree.get("session_summary", {})
    nodes   = belief_tree.get("belief_nodes", [])
    date_str = datetime.date.today().strftime("%B %d, %Y")

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=18*mm, bottomMargin=18*mm,
    )

    # ── Style Definitions ──
    brand_s = ParagraphStyle("brand_s", fontSize=9, textColor=colors.HexColor("#818CF8"), fontName="Helvetica-Bold", letterSpacing=1.5)
    title_s = ParagraphStyle("title_s", fontSize=24, textColor=colors.white, spaceAfter=2, fontName="Helvetica-Bold", leading=28)
    sub_s   = ParagraphStyle("sub_s",   fontSize=9, textColor=colors.HexColor("#9CA3AF"), spaceAfter=24, fontName="Helvetica-Oblique")
    
    card_idx = ParagraphStyle("card_idx", fontSize=8, textColor=colors.HexColor("#818CF8"), fontName="Helvetica-Bold", alignment=TA_CENTER)
    meta_s   = ParagraphStyle("meta_s",   fontSize=7, textColor=colors.HexColor("#818CF8"), letterSpacing=1.5, fontName="Helvetica-Bold")
    belief_s = ParagraphStyle("belief_s", fontSize=15, textColor=colors.white, fontName="Helvetica-Bold", leading=18, spaceAfter=8)
    anal_s   = ParagraphStyle("anal_s",   fontSize=10, textColor=colors.HexColor("#D1D5DB"), leading=14, spaceAfter=10)
    
    label_s  = ParagraphStyle("label_s",  fontSize=6, textColor=colors.HexColor("#9CA3AF"), fontName="Helvetica-Bold", letterSpacing=2, spaceBefore=4)
    cost_s   = ParagraphStyle("cost_s",   fontSize=9, textColor=colors.HexColor("#F87171"), fontName="Helvetica-Oblique", leading=12)
    mantra_s = ParagraphStyle("mantra_s", fontSize=11, textColor=colors.HexColor("#4ADE80"), fontName="Helvetica-BoldOblique", leading=14)
    
    sum_lbl = ParagraphStyle("sum_lbl", fontSize=7,  textColor=colors.HexColor("#818CF8"), spaceAfter=3,  letterSpacing=2, fontName="Helvetica-Bold")
    sum_val = ParagraphStyle("sum_val", fontSize=10, textColor=colors.HexColor("#E5E7EB"), spaceAfter=8)
    footer_s= ParagraphStyle("footer_s",fontSize=6,  textColor=colors.HexColor("#4B5563"), alignment=TA_CENTER, letterSpacing=2)

    story = []

    # ── Header ──
    story.append(Paragraph("MINDROOTS", brand_s))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(summary.get("dominant_theme") or "Belief Archaeology Report", title_s))
    story.append(Paragraph(f"{date_str} · Generated for deep self-reflection", sub_s))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1F2937"), spaceAfter=24))

    # ── Belief Cards ──
    for i, node in enumerate(nodes):
        # Card Body (multi-line story)
        card_story = []
        
        # Meta info row
        origin = f"ORIGIN // {node.get('origin_year','?')}  ·  AGE {node.get('age_at_origin','?')}  ·  {(node.get('origin_person') or 'Unknown').upper()}"
        card_story.append(Paragraph(origin, meta_s))
        card_story.append(Spacer(1, 8))
        
        # Primary Belief
        card_story.append(Paragraph(f'"{node.get("belief","")}"', belief_s))
        
        # Analysis
        if node.get("written_analysis"):
            card_story.append(Paragraph(node["written_analysis"], anal_s))
        
        # Cost & Mantra with subtle background/borders
        extras = []
        if node.get("cost_today"):
            extras.append([Paragraph("COST TODAY", label_s), Paragraph(node["cost_today"], cost_s)])
        if node.get("reframing_mantra"):
            extras.append([Paragraph("NEW MANTRA", label_s), Paragraph(node["reframing_mantra"], mantra_s)])
        
        if extras:
            extras_table = Table(extras, colWidths=[100, 300])
            extras_table.setStyle(TableStyle([
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LINEABOVE', (0,1), (-1,1), 0.5, colors.HexColor("#1F2937")),
            ]))
            card_story.append(extras_table)

        # Wrap each card in a Table for structure (index on left, content on right)
        card_wrapper = Table([[Paragraph(str(i+1).zfill(2), card_idx), card_story]], colWidths=[30, 440])
        card_wrapper.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0F1115")), # Slightly lighter than bg
            ('ROUNDEDCORNERS', [8, 8, 8, 8]),
        ]))
        
        story.append(KeepTogether(card_wrapper))
        story.append(Spacer(1, 16))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#1F2937"), spaceAfter=18, spaceBefore=4))

    # ── Session Summary ──
    if summary:
        story.append(Spacer(1, 6))
        story.append(Paragraph("SESSION SUMMARY", sum_lbl))
        if summary.get("overall_emotional_tone"):
            story.append(Paragraph(f"Emotional Tone: {summary['overall_emotional_tone'].title()}", sum_val))
        if summary.get("estimated_total_cost"):
            story.append(Paragraph(f"Total Cost: {summary['estimated_total_cost']}", sum_val))
        if summary.get("dominant_theme"):
            story.append(Paragraph(f"Dominant Theme: {summary['dominant_theme']}", sum_val))

    # ── Footer ──
    story.append(Spacer(1, 25))
    story.append(Paragraph("MINDROOTS INTROSPECTIVE SYSTEMS · CONFIDENTIAL", footer_s))

    doc.build(story, onFirstPage=draw_background, onLaterPages=draw_background)
    buf.seek(0)
    return buf.read()


@app.post("/api/generate-pdf")
async def generate_pdf(req: PdfRequest):
    """Generate a Belief Origin Tree PDF from the provided belief tree JSON."""
    try:
        pdf_bytes = _build_belief_pdf(req.beliefTree)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="mindroots-report.pdf"'},
        )
    except Exception as e:
        print(f"[PDF] Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {
        "service": "MindRoots Backend API",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "config_get": "GET /api/config",
            "config_post": "POST /api/config",
            "token": "POST /api/token",
            "generate_pdf": "POST /api/generate-pdf"
        }
    }


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

