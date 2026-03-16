'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged } from '@/services/FirebaseService'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''
const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean)

const VOICES = ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck', 'Orbit', 'Zephyr', 'Leda']
const MODELS = [
  'gemini-2.5-flash-native-audio',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
]

const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/[0.02]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#818CF8] text-[20px]">{icon}</span>
          <span className="font-semibold text-slate-200 tracking-tight">{title}</span>
        </div>
        <span className={`material-symbols-outlined text-slate-500 text-[20px] transition-transform ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="px-6 pb-6 pt-1 border-t border-white/5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

const Label = ({ children, hint }) => (
  <div className="mb-1.5">
    <label className="block text-xs uppercase tracking-widest font-semibold text-slate-500">{children}</label>
    {hint && <p className="text-xs text-slate-600 mt-0.5">{hint}</p>}
  </div>
)

const Toggle = ({ value, onChange, label }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm text-slate-300">{label}</span>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-[#818CF8]/80' : 'bg-white/10'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
)

export default function AdminPage() {
  const router = useRouter()
  const [accessDenied, setAccessDenied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [backendDown, setBackendDown] = useState(false)

  const [cfg, setCfg] = useState({
    model: MODELS[0],
    voice: 'Puck',
    temperature: 1.0,
    max_excavations: 5,
    enable_affective_dialog: true,
    enable_proactive_audio: true,
    enable_google_grounding: false,
    enable_input_transcription: true,  // Kept true to drive the app's chat UI
    enable_output_transcription: true, // Kept true to drive the app's chat UI
    vad_start_sensitivity: 'DEFAULT',
    vad_end_sensitivity: 'DEFAULT',
    vad_silence_duration_ms: 500,
    vad_prefix_padding_ms: 500,
    system_prompt: 'You are a helpful assistant. Be concise and friendly.',
    youtube_video_url: 'https://www.youtube.com/embed/jNQXAC9IVRw?rel=0',
  })

  const set = (key, val) => setCfg(c => ({ ...c, [key]: val }))

  // Auth gate
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/'); return }
      if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(user.uid)) {
        setAccessDenied(true)
        setLoading(false)
        return
      }
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  // Load current config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/config`)
      if (!res.ok) throw new Error('Backend unreachable')
      const data = await res.json()
      setCfg(prev => ({
        ...prev,
        model: data.model ?? prev.model,
        voice: data.voice ?? prev.voice,
        temperature: data.temperature ?? prev.temperature,
        max_excavations: data.max_excavations ?? prev.max_excavations,
        enable_affective_dialog: data.enable_affective_dialog ?? prev.enable_affective_dialog,
        enable_proactive_audio: data.enable_proactive_audio ?? prev.enable_proactive_audio,
        enable_google_grounding: data.enable_google_grounding ?? prev.enable_google_grounding,
        enable_input_transcription: data.enable_input_transcription ?? prev.enable_input_transcription,
        enable_output_transcription: data.enable_output_transcription ?? prev.enable_output_transcription,
        vad_start_sensitivity: data.vad_start_sensitivity ?? prev.vad_start_sensitivity,
        vad_end_sensitivity: data.vad_end_sensitivity ?? prev.vad_end_sensitivity,
        vad_silence_duration_ms: data.vad_silence_duration_ms ?? prev.vad_silence_duration_ms,
        vad_prefix_padding_ms: data.vad_prefix_padding_ms ?? prev.vad_prefix_padding_ms,
        system_prompt: data.system_prompt ?? '',
      }))
      setBackendDown(false)
    } catch {
      setBackendDown(true)
    }
  }, [])

  useEffect(() => {
    if (!loading && !accessDenied) fetchConfig()
  }, [loading, accessDenied, fetchConfig])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...cfg,
        system_prompt: cfg.system_prompt || null,
        temperature: parseFloat(cfg.temperature),
        max_excavations: parseInt(cfg.max_excavations),
        vad_silence_duration_ms: parseInt(cfg.vad_silence_duration_ms),
        vad_prefix_padding_ms: parseInt(cfg.vad_prefix_padding_ms),
      }
      const res = await fetch(`${BACKEND}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': ADMIN_SECRET,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Update failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#818CF8]/30 border-t-[#818CF8] rounded-full animate-spin" />
    </div>
  )

  if (accessDenied) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center space-y-3">
        <span className="material-symbols-outlined text-5xl text-red-400">block</span>
        <p className="text-white font-bold text-xl">Access Denied</p>
        <p className="text-slate-500 text-sm">Your account does not have admin privileges.</p>
        <button onClick={() => router.push('/')} className="mt-4 px-5 py-2 bg-white/10 text-slate-200 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors">
          Go Home
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans relative">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#818CF8]/4 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-purple-600/4 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm mb-6 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#818CF8]/15 border border-[#818CF8]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#818CF8] text-[20px]">settings</span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">API Configuration</h1>
              <p className="text-slate-500 text-sm">Changes apply to the next session — no restart needed</p>
            </div>
          </div>

          {backendDown && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <span className="material-symbols-outlined text-[18px]">wifi_off</span>
              Python backend is not reachable at {BACKEND}. Start it with <code className="ml-1 font-mono bg-red-500/20 px-1 rounded">python server.py</code>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Connection / Model */}
          <Section title="Connection Settings" icon="hub">
            <div>
              <Label>Model ID</Label>
              <select
                value={cfg.model}
                onChange={e => set('model', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#818CF8]/50 transition-colors"
              >
                {MODELS.map(m => <option key={m} value={m} className="bg-[#1a1a2e]">{m}</option>)}
              </select>
            </div>
          </Section>

          {/* Appearance */}
          <Section title="Appearance" icon="palette">
            <div>
              <Label hint="The primary YouTube video embed URL shown on the home page.">YouTube Video URL</Label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#818CF8]/50 transition-colors"
                value={cfg.youtube_video_url || ''}
                onChange={e => set('youtube_video_url', e.target.value)}
              />
            </div>
          </Section>

          {/* Gemini Behavior */}
          <Section title="Gemini Behavior" icon="psychology">
            <div>
              <Label hint={`${parseFloat(cfg.temperature).toFixed(1)} — Higher = more creative`}>
                Temperature: {parseFloat(cfg.temperature).toFixed(1)}
              </Label>
              <input
                type="range" min="0" max="2" step="0.1"
                value={cfg.temperature}
                onChange={e => set('temperature', e.target.value)}
                className="w-full accent-[#818CF8]"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>0.0 Predictable</span><span>1.0 Default</span><span>2.0 Creative</span>
              </div>
            </div>

            <div>
              <Label hint="Max belief excavations per session before completion is triggered">Max Excavations</Label>
              <input
                type="number" min="1" max="10"
                value={cfg.max_excavations}
                onChange={e => set('max_excavations', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#818CF8]/50 transition-colors"
              />
            </div>

            <div className="space-y-1 pt-1">
              <Toggle value={cfg.enable_proactive_audio} onChange={v => set('enable_proactive_audio', v)} label="Enable proactive audio" />
              <Toggle value={cfg.enable_affective_dialog} onChange={v => set('enable_affective_dialog', v)} label="Enable affective dialog (emotion detection)" />
              <Toggle value={cfg.enable_google_grounding} onChange={v => set('enable_google_grounding', v)} label="Enable Google grounding" />
            </div>
          </Section>

          {/* Transcription Settings */}
          <Section title="Transcription Settings" icon="closed_caption">
            <div className="space-y-1">
              <Toggle value={cfg.enable_input_transcription} onChange={v => set('enable_input_transcription', v)} label="Enable input transcription (your speech)" />
              <Toggle value={cfg.enable_output_transcription} onChange={v => set('enable_output_transcription', v)} label="Enable output transcription (Gemini responses)" />
            </div>
          </Section>

          {/* VAD */}
          <Section title="Activity Detection Settings" icon="mic">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label hint="How easily speech START is detected">Start Sensitivity</Label>
                <div className="flex gap-2">
                  {['DEFAULT', 'LOW', 'HIGH'].map(s => (
                    <button key={s} onClick={() => set('vad_start_sensitivity', s)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${cfg.vad_start_sensitivity === s
                        ? 'bg-[#818CF8]/25 border-[#818CF8]/60 text-[#818CF8]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label hint="How easily speech END is detected">End Sensitivity</Label>
                <div className="flex gap-2">
                  {['DEFAULT', 'LOW', 'HIGH'].map(s => (
                    <button key={s} onClick={() => set('vad_end_sensitivity', s)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${cfg.vad_end_sensitivity === s
                        ? 'bg-[#818CF8]/25 border-[#818CF8]/60 text-[#818CF8]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label hint="Milliseconds of silence required before ending a speech turn">
                Silence Duration: {cfg.vad_silence_duration_ms}ms
              </Label>
              <input
                type="range" min="500" max="5000" step="100"
                value={cfg.vad_silence_duration_ms}
                onChange={e => set('vad_silence_duration_ms', e.target.value)}
                className="w-full accent-[#818CF8]"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>500ms Fast</span><span>2000ms Default</span><span>5000ms Slow</span>
              </div>
            </div>
            <div className="mt-4">
              <Label hint="Milliseconds of audio to pad at the start of a speech turn">
                Prefix Padding: {cfg.vad_prefix_padding_ms}ms
              </Label>
              <input
                type="range" min="100" max="2000" step="100"
                value={cfg.vad_prefix_padding_ms}
                onChange={e => set('vad_prefix_padding_ms', e.target.value)}
                className="w-full accent-[#818CF8]"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>100ms</span><span>500ms Default</span><span>2000ms</span>
              </div>
            </div>
          </Section>

          {/* System Prompt */}
          <Section title="System Prompt Override" icon="edit_note" defaultOpen={false}>
            <div>
              <Label hint="Leave empty to use the built-in Socratic Interviewer prompt">Custom System Prompt</Label>
              <textarea
                rows={10}
                value={cfg.system_prompt}
                onChange={e => set('system_prompt', e.target.value)}
                placeholder="Leave empty to use the default Socratic Interviewer prompt..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-[#818CF8]/50 transition-colors resize-none placeholder:text-slate-600"
              />
              <button
                onClick={() => set('system_prompt', '')}
                className="mt-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                ↩ Reset to default
              </button>
            </div>
          </Section>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-6 mt-8">
          <div className="flex items-center gap-4 px-6 py-4 bg-[#13131f]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            {error && (
              <p className="text-red-400 text-sm flex items-center gap-2 flex-1">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </p>
            )}
            {saved && (
              <p className="text-emerald-400 text-sm flex items-center gap-2 flex-1">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Config saved — takes effect on next session
              </p>
            )}
            {!error && !saved && <p className="text-slate-600 text-sm flex-1">Changes apply to the next WebSocket session</p>}
            <button
              onClick={fetchConfig}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-white/5 rounded-xl border border-white/10 transition-colors font-semibold"
            >
              Reload
            </button>
            <button
              onClick={handleSave}
              disabled={saving || backendDown}
              className="px-6 py-2 bg-[#818CF8] text-white font-bold text-sm rounded-xl hover:bg-[#6d78e0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-[#818CF8]/25"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">save</span> Save Config</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
