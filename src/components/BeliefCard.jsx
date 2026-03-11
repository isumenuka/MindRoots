'use client'

export default function BeliefCard({ node, index }) {
  if (!node) return null

  const emotionColors = {
    low: '#4ade80',
    medium: '#facc15',
    high: '#fb923c',
    profound: '#f87171',
  }
  const weightColor = emotionColors[node.emotional_weight] || '#818CF8'

  return (
    <div className="relative flex flex-col lg:flex-row gap-0 bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-xl overflow-hidden group hover:border-[#818CF8]/30 transition-all duration-500">
      {/* Left: Illustration */}
      <div className="lg:w-1/3 h-52 lg:h-auto relative overflow-hidden min-h-[200px]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 to-transparent z-10" />
        {node.illustration_url ? (
          <img
            src={node.illustration_url}
            alt={`Origin of: ${node.belief}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#0d0d1a] transition-transform duration-700 group-hover:scale-110" />
        )}
        <div className="absolute bottom-4 left-4 z-20">
          <span className="text-[40px] font-display font-black text-white/10">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Right: Content */}
      <div className="lg:w-2/3 p-6 lg:p-8 flex flex-col justify-center">
        {/* Origin timeline marker */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-[#818CF8]/40" />
          <div className="flex items-center gap-2">
            <div
              className="size-2 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]"
              style={{ backgroundColor: weightColor }}
            />
            <span className="text-xs font-bold text-[#818CF8] uppercase tracking-widest">
              Origin: {node.origin_year} {node.age_at_origin ? `(Age ${node.age_at_origin})` : ''} · {node.origin_person}
            </span>
          </div>
        </div>

        {/* Belief statement */}
        <h3 className="text-2xl font-display font-semibold text-slate-100 mb-4 leading-tight">
          "{node.belief}"
        </h3>

        {/* Written analysis */}
        {node.written_analysis && (
          <p className="text-slate-400 leading-relaxed mb-6 text-sm lg:text-base">
            {node.written_analysis}
          </p>
        )}

        {/* Cost Today */}
        <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-4 border-l-2 border-[#818CF8]/50">
          <p className="text-xs font-bold text-[#818CF8] uppercase tracking-widest mb-1">Cost Today</p>
          <p className="text-slate-300 text-sm italic">{node.cost_today}</p>
        </div>

        {/* Emotional weight badge */}
        <div className="mt-4 flex items-center gap-2">
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: `${weightColor}22`, color: weightColor, border: `1px solid ${weightColor}44` }}
          >
            {node.emotional_weight} weight
          </span>
          {node.still_serving === false && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
              No longer serving you
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
