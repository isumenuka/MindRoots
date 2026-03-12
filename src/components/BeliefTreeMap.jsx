'use client'
import { useState, useRef, useCallback } from 'react'

const WEIGHT_COLORS = {
  profound: '#f87171',
  high: '#fb923c',
  medium: '#facc15',
  low: '#4ade80',
}

const Y_START = 120          // root node y
const NODE_HEIGHT = 140      // vertical gap between levels
const NODE_W = 200           // node card width
const NODE_H = 90            // node card height
const ROOT_W = 240
const ROOT_H = 60

export default function BeliefTreeMap({ beliefs = [], session = {} }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const n = beliefs.length
  if (n === 0) return (
    <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
      No beliefs to map yet.
    </div>
  )

  // Layout: root at top-center, beliefs spread below
  const gapX = Math.max(NODE_W + 30, 900 / (n + 1))
  const totalW = Math.max(900, n * gapX + 60)
  const totalH = Y_START + NODE_HEIGHT + NODE_H + 80

  const rootX = totalW / 2
  const rootY = Y_START
  const beliefY = Y_START + NODE_HEIGHT

  const nodePositions = beliefs.map((_, i) => ({
    x: (i + 1) * (totalW / (n + 1)),
    y: beliefY,
  }))

  const handleNodeEnter = (e, node, pos) => {
    setTooltip({ node, x: pos.x, y: pos.y })
  }
  const handleNodeLeave = () => setTooltip(null)

  const truncate = (str, len = 36) =>
    str && str.length > len ? str.slice(0, len) + '…' : str || ''

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        ref={svgRef}
        width={totalW}
        height={totalH}
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="mx-auto block"
        style={{ maxWidth: '100%' }}
      >
        <defs>
          {/* Belief node glows per weight */}
          {['profound','high','medium','low'].map(w => (
            <filter key={w} id={`glow_${w}`}>
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
          <filter id="glow_root">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="rootGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.15" />
          </linearGradient>
          <marker id="dot" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5">
            <circle cx="2.5" cy="2.5" r="2" fill="#818CF8" opacity="0.6" />
          </marker>
        </defs>

        {/* ── Connecting lines ─────────────────────────────────────────── */}
        {beliefs.map((belief, i) => {
          const pos = nodePositions[i]
          let startX = rootX
          let startY = rootY + ROOT_H / 2
          
          // Connect to parent node if parent_id exists
          if (belief.parent_id) {
            const parentIdx = beliefs.findIndex(b => b.id === belief.parent_id)
            if (parentIdx !== -1 && parentIdx !== i) {
              startX = nodePositions[parentIdx].x
              startY = nodePositions[parentIdx].y + NODE_H / 2
            }
          }

          const color = WEIGHT_COLORS[belief.emotional_weight] || '#818CF8'
          return (
            <path
              key={`line_${i}`}
              d={`M ${startX} ${startY} C ${startX} ${startY + (pos.y - startY) * 0.5}, ${pos.x} ${pos.y - (pos.y - startY) * 0.5}, ${pos.x} ${pos.y - NODE_H / 2}`}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeOpacity="0.4"
              strokeDasharray="4 4"
              markerStart={!belief.parent_id ? "url(#dot)" : ""}
            />
          )
        })}

        {/* ── Root node ─────────────────────────────────────────────────── */}
        <g transform={`translate(${rootX - ROOT_W / 2}, ${rootY - ROOT_H / 2})`}>
          <rect
            width={ROOT_W} height={ROOT_H} rx="14"
            fill="url(#rootGrad)" opacity="0.15"
            stroke="#818CF8" strokeWidth="1"
            filter="url(#glow_root)"
          />
          <rect width={ROOT_W} height={ROOT_H} rx="14" fill="none" stroke="#818CF8" strokeWidth="1" />
          <text x={ROOT_W / 2} y="18" textAnchor="middle"
            fontSize="8" fill="#818CF8" fontFamily="monospace" letterSpacing="2">
            BELIEF ORIGIN TREE
          </text>
          <foreignObject x="10" y="22" width={ROOT_W - 20} height="32">
            <div xmlns="http://www.w3.org/1999/xhtml"
              style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', lineHeight: 1.35,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.dominant_theme || 'Your Belief Origins'}
            </div>
          </foreignObject>
        </g>

        {/* ── Belief nodes ──────────────────────────────────────────────── */}
        {nodePositions.map((pos, i) => {
          const belief = beliefs[i]
          const color = WEIGHT_COLORS[belief.emotional_weight] || '#818CF8'
          return (
            <g
              key={`node_${i}`}
              transform={`translate(${pos.x - NODE_W / 2}, ${pos.y - NODE_H / 2})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handleNodeEnter(e, belief, pos)}
              onMouseLeave={handleNodeLeave}
            >
              {/* Card bg */}
              <rect width={NODE_W} height={NODE_H} rx="10"
                fill="#0d1117" stroke={color} strokeWidth="1" strokeOpacity="0.5"
                filter={`url(#glow_${belief.emotional_weight || 'profound'})`}
              />
              {/* Left accent bar */}
              <rect x="0" y="0" width="3" height={NODE_H} rx="2" fill={color} opacity="0.8" />
              {/* Index number */}
              <text x="14" y="20" fontSize="9" fill={color} fontFamily="monospace" fontWeight="700" opacity="0.8">
                {String(i + 1).padStart(2, '0')}
              </text>
              {/* Origin meta */}
              <text x="14" y="34" fontSize="8" fill={color} fontFamily="monospace" letterSpacing="1" opacity="0.7">
                {belief.origin_year || '?'} · {belief.origin_person || '?'}
              </text>
              {/* Belief text */}
              <foreignObject x="10" y="40" width={NODE_W - 20} height="36">
                <div xmlns="http://www.w3.org/1999/xhtml"
                  style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0',
                    lineHeight: 1.4, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  "{truncate(belief.belief, 55)}"
                </div>
              </foreignObject>
              {/* Still serving dot */}
              <circle cx={NODE_W - 14} cy="14" r="4"
                fill={belief.still_serving ? '#4ade80' : '#f87171'} opacity="0.9" />
            </g>
          )
        })}

        {/* ── Timeline axis ─────────────────────────────────────────────── */}
        {(() => {
          const years = beliefs.map(b => b.origin_year).filter(Boolean).sort()
          if (years.length < 2) return null
          const minY = years[0], maxY = years[years.length - 1]
          return (
            <g opacity="0.3">
              <line x1="28" y1={rootY} x2="28" y2={beliefY + NODE_H / 2}
                stroke="#818CF8" strokeWidth="0.5" />
              <text x="28" y={rootY - 10} textAnchor="middle" fontSize="8"
                fill="#818CF8" fontFamily="monospace">NOW</text>
              <text x="28" y={beliefY + NODE_H / 2 + 14} textAnchor="middle" fontSize="8"
                fill="#818CF8" fontFamily="monospace">{minY}</text>
              {[...new Set(years)].map(y => {
                const ratio = (y - minY) / Math.max(maxY - minY, 1)
                const yPos = rootY + ratio * NODE_HEIGHT
                return (
                  <g key={y}>
                    <line x1="22" y1={yPos} x2="34" y2={yPos} stroke="#818CF8" strokeWidth="0.5" />
                    <text x="18" y={yPos + 3} textAnchor="end" fontSize="7"
                      fill="#818CF8" fontFamily="monospace">{y}</text>
                  </g>
                )
              })}
            </g>
          )
        })()}
      </svg>

      {/* ── Tooltip ──────────────────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-xl border border-white/10 bg-[#0d1117]/95 backdrop-blur-xl p-4 shadow-2xl w-64"
          style={{
            left: Math.min(tooltip.x, totalW - 270),
            top: tooltip.y + 10,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: WEIGHT_COLORS[tooltip.node.emotional_weight] || '#818CF8' }}>
            {tooltip.node.emotional_weight} weight
            <span className="ml-2 text-slate-500">·</span>
            <span className="ml-2 text-slate-400">
              {tooltip.node.still_serving ? '✓ Still serving' : '✗ No longer serving you'}
            </span>
          </p>
          <p className="text-slate-200 text-xs font-semibold leading-snug mb-2">
            "{tooltip.node.belief}"
          </p>
          {tooltip.node.cost_today && (
            <div className="mt-2 border-l-2 border-[#f87171]/60 pl-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#f87171] mb-0.5">Cost Today</p>
              <p className="text-slate-400 text-[11px] italic">{tooltip.node.cost_today}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
