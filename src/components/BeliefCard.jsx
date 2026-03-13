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
    <div className="relative flex flex-col lg:flex-row gap-6 bg-card border border-white/5 rounded-xl overflow-hidden group hover:border-accent/30 transition-all duration-500 shadow-xl shadow-black/20">
      {/* Left: Illustration */}
      <div className="lg:w-1/3 h-52 lg:h-auto relative overflow-hidden min-h-[200px]">
        <div className="absolute inset-0 bg-gradient-to-r from-background-dark/80 to-transparent z-10" />
        {node.illustration_url ? (
          <img
            src={node.illustration_url}
            alt={`Origin of: ${node.belief}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" />
        )}
        <div className="absolute bottom-4 left-4 z-20">
          <span className="text-[40px] font-display font-black text-white/10 group-hover:text-white/20 transition-colors duration-500">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Right: Content */}
      <div className="lg:w-2/3 p-6 lg:p-8 flex flex-col justify-center relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-700 pointer-events-none"></div>
        {/* Origin timeline marker */}
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="h-px w-8 bg-accent/40" />
          <div className="flex items-center gap-2">
            <div
              className="size-2 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]"
              style={{ backgroundColor: weightColor }}
            />
            <span className="text-sm font-bold text-accent uppercase tracking-widest">
              Origin: {node.origin_year} {node.age_at_origin ? `(Age ${node.age_at_origin})` : ''} · {node.origin_person}
            </span>
          </div>
        </div>

        {/* Belief statement */}
        <h3 className="text-3xl font-display font-semibold text-slate-100 mb-4 leading-tight relative z-10">
          "{node.belief}"
        </h3>

        {/* Written analysis */}
        {node.written_analysis && (
          <p className="text-slate-400 font-body leading-relaxed mb-6 text-base lg:text-lg relative z-10 group-hover:text-slate-300 transition-colors duration-300">
            {node.written_analysis}
          </p>
        )}

        {/* Cost Today */}
        <div className="bg-surface rounded-lg p-4 border-l-2 border-accent/50 relative z-10 group-hover:border-accent transition-colors duration-300">
          <p className="text-sm font-bold text-accent uppercase tracking-widest mb-1">Cost Today</p>
          <p className="text-slate-300 text-base italic">{node.cost_today}</p>
        </div>

        {/* Emotional weight badge */}
        <div className="mt-4 flex items-center gap-2">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: `${weightColor}22`, color: weightColor, border: `1px solid ${weightColor}44` }}
          >
            {node.emotional_weight} weight
          </span>
          {node.still_serving === false && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
              No longer serving you
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
