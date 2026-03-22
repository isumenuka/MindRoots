'use client'

import { getNodeDisplayInfo } from '@/utils/nodeTypes'

const WEIGHT_CONFIG = {
  profound: { color: '#f87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.25)', label: 'Profound Weight' },
  high:     { color: '#fb923c', bg: 'rgba(251,146,60,0.06)',  border: 'rgba(251,146,60,0.25)',  label: 'High Weight' },
  medium:   { color: '#facc15', bg: 'rgba(250,204,21,0.06)',  border: 'rgba(250,204,21,0.25)',  label: 'Medium Weight' },
  low:      { color: '#4ade80', bg: 'rgba(74,222,128,0.06)',  border: 'rgba(74,222,128,0.25)',  label: 'Low Weight' },
}

export default function CostImpactPanel({ beliefs = [], session = {} }) {
  const profoundBeliefs = beliefs.filter(b => b.emotional_weight === 'profound' || b.emotional_weight === 'high')

  return (
    <section className="mt-12 mb-8">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs font-black text-red-400 uppercase tracking-[0.2em]">
            The Cost & Impact of These Insights
          </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
      </div>

      {/* Per-belief cost rows */}
      <div className="space-y-3 mb-8">
        {beliefs.map((belief, i) => {
          const cfg = WEIGHT_CONFIG[belief.emotional_weight] || WEIGHT_CONFIG.medium
          const info = getNodeDisplayInfo(belief)
          return (
            <div
              key={i}
              className="relative flex gap-4 rounded-xl p-4 border overflow-hidden group transition-all duration-300"
              style={{ background: cfg.bg, borderColor: cfg.border }}
            >
              {/* Hover shimmer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(135deg, ${cfg.bg}, transparent)` }} />

              {/* Index */}
              <div className="relative flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <span className="text-sm font-black font-mono" style={{ color: cfg.color }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Belief → cost */}
              <div className="relative flex-1 min-w-0">
                <p className="text-slate-300 text-base font-semibold mb-1 leading-snug">
                  "{info.primaryText}"
                </p>
                <div className="flex items-start gap-2 mt-2">
                  <span className="text-xs font-black uppercase tracking-widest mt-0.5"
                    style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-slate-600 text-xs mt-0.5">→</span>
                  <span className="text-slate-400 text-sm italic leading-snug">{info.tooltip1Val || info.tooltip2Val || info.tooltip1Title || 'Impact recorded'}</span>
                </div>
              </div>

              {/* Origin tag */}
              <div className="relative flex-shrink-0 text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{info.title}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: cfg.color }}>
                  {info.subtitle || 'Present'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total cost summary card */}
      {(session?.estimated_total_cost || profoundBeliefs.length > 0) && (
        <div className="relative rounded-2xl p-6 lg:p-8 overflow-hidden border border-red-500/20"
          style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.12), rgba(7,10,16,0.9))' }}>
          {/* Glow */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl"
            style={{ background: 'rgba(239,68,68,0.08)' }} />

          <div className="relative">
            <p className="text-xs font-black text-red-400 uppercase tracking-[0.2em] mb-3">
              Total Life Impact
            </p>
            <p className="text-2xl lg:text-3xl font-display font-bold text-slate-100 leading-snug mb-4">
              {session?.estimated_total_cost ||
                `${profoundBeliefs.length} high-weight belief${profoundBeliefs.length !== 1 ? 's' : ''} actively limiting your potential`
              }
            </p>
            <p className="text-base text-slate-400 italic font-body">
              These beliefs were installed before you had the wisdom to question them. Now you have the map — the next step is yours.
            </p>
          </div>

          {/* Stats row */}
          <div className="relative mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Profound', val: beliefs.filter(b => b.emotional_weight === 'profound').length, color: '#f87171' },
              { label: 'High Weight', val: beliefs.filter(b => b.emotional_weight === 'high').length, color: '#fb923c' },
              { label: 'Not Serving', val: beliefs.filter(b => b.still_serving === false).length, color: '#818CF8' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p className="text-3xl font-display font-black" style={{ color }}>{val}</p>
                <p className="text-xs uppercase tracking-widest text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
