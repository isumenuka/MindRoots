'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const NODE_W = 220
const NODE_H = 100
const GAP_X  = 60
const LEVEL_H = 220
const WEIGHT_COLORS = {
  profound: '#f87171',
  high:     '#fb923c',
  medium:   '#facc15',
  low:      '#4ade80',
}

export default function BeliefTreeMap({ beliefs = [], session = {} }) {
  const svgRef  = useRef(null)
  const [size,  setSize]  = useState({ w: 800, h: 600 })
  const [pan,   setPan]   = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(0.85)
  const [drag,  setDrag]  = useState(null)   // { startX, startY, panX, panY } | null
  const [hovered, setHovered] = useState(null)

  // ── Track container size ────────────────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Two-pass layout (centered per level) ───────────────────────────────────
  const positions = useCallback(() => {
    if (!beliefs.length) return {}

    // Build adjacency
    const nodeMap = {}
    beliefs.forEach(b => { nodeMap[b.id] = { ...b, children: [] } })
    const roots = []
    beliefs.forEach(n => {
      if (n.parent_id && nodeMap[n.parent_id]) {
        nodeMap[n.parent_id].children.push(n.id)
      } else {
        roots.push(n.id)
      }
    })

    // Pass 1 – BFS to record level + order
    const levelOrders = {}
    const levelCounts = {}
    const bfs = (id, lvl) => {
      levelCounts[lvl] = (levelCounts[lvl] || 0)
      levelOrders[id]  = { level: lvl, order: levelCounts[lvl] }
      levelCounts[lvl]++
      const n = nodeMap[id]
      if (n?.children) n.children.forEach(c => bfs(c, lvl + 1))
    }
    roots.forEach(r => bfs(r, 1))

    // Pass 2 – compute x centred around 0, y by level
    const pos = {}
    Object.keys(levelOrders).forEach(id => {
      const { level, order } = levelOrders[id]
      const count      = levelCounts[level]
      const totalWidth = count * (NODE_W + GAP_X) - GAP_X
      pos[id] = {
        x: order * (NODE_W + GAP_X) - totalWidth / 2,
        y: level * LEVEL_H,
      }
    })
    return pos
  }, [beliefs])()

  // ── Interaction helpers ─────────────────────────────────────────────────────
  const doZoom = useCallback((factor) => {
    setScale(s => Math.min(Math.max(s * factor, 0.15), 4))
  }, [])

  const doReset = useCallback(() => {
    setPan({ x: 0, y: 0 })
    setScale(0.85)
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      doZoom(e.deltaY > 0 ? 0.9 : 1.1)
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
  }, [doZoom])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()
    setDrag({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y })
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    if (!drag) return
    setPan({
      x: drag.panX + (e.clientX - drag.startX),
      y: drag.panY + (e.clientY - drag.startY),
    })
  }, [drag])

  const handleMouseUp = useCallback(() => setDrag(null), [])

  useEffect(() => {
    if (drag) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup',   handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   handleMouseUp)
    }
  }, [drag, handleMouseMove, handleMouseUp])

  // ── Tree coordinate constants ───────────────────────────────────────────────
  const ROOT_W = 240
  const ROOT_H = 80
  const rootX = 0
  const rootY = 0

  // The <g> pivots so that (0,0) sits at the centre of the visible SVG
  const cx = size.w / 2 + pan.x
  const cy = size.h * 0.38 + pan.y

  return (
    <div className="relative w-full h-[680px] bg-[#05070a] rounded-2xl border border-white/5 overflow-hidden select-none">

      {/* ── Zoom / Reset buttons ─────────────────────────────────────────────── */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-2.5">
        {[
          { icon: 'add',         onClick: () => doZoom(1.2) },
          { icon: 'remove',      onClick: () => doZoom(0.83) },
          { icon: 'restart_alt', onClick: doReset },
        ].map(({ icon, onClick }) => (
          <button
            key={icon}
            onClick={onClick}
            className="w-11 h-11 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-slate-100 hover:bg-slate-800 transition-all shadow-xl backdrop-blur-xl"
          >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </button>
        ))}
      </div>

      {/* ── Nav hint ─────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-6 z-20 pointer-events-none opacity-35">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="material-symbols-outlined text-[13px] text-slate-400">mouse</span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Nav Control</p>
        </div>
        <p className="text-[9px] text-slate-500 uppercase tracking-widest pl-5">DRAG: Pan · CTRL+SCROLL: Zoom</p>
      </div>

      {/* ── SVG canvas ───────────────────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: 'block', cursor: drag ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <defs>
          <marker id="arrowDot" markerWidth="6" markerHeight="6" refX="3" refY="3">
            <circle cx="3" cy="3" r="2" fill="#818CF8" opacity="0.5" />
          </marker>
        </defs>

        {/* All tree content centred at (cx, cy) */}
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>

          {/* ── Root node ────────────────────────────────────────────────────── */}
          <g transform={`translate(${rootX - ROOT_W / 2}, ${rootY - ROOT_H / 2})`}>
            <rect
              width={ROOT_W} height={ROOT_H} rx="40"
              fill="#1e2a3a" stroke="#818CF8" strokeWidth="1.8" strokeDasharray="6 4"
            />
            <text x={ROOT_W / 2} y={28} textAnchor="middle"
              fill="#818CF8" fontSize="9" fontWeight="800"
              fontFamily="Inter, sans-serif" letterSpacing="2"
              textDecoration="none"
            >MINDROOTS ORIGIN</text>
            <text x={ROOT_W / 2} y={54} textAnchor="middle"
              fill="white" fontSize="14" fontWeight="700"
              fontFamily="Outfit, sans-serif"
            >
              {(session?.dominant_theme || 'Your Core Theme').slice(0, 24)}
              {(session?.dominant_theme?.length > 24) ? '…' : ''}
            </text>
          </g>

          {/* ── Connector lines ──────────────────────────────────────────────── */}
          {beliefs.map(belief => {
            const pos   = positions[belief.id]
            if (!pos) return null
            const color = WEIGHT_COLORS[belief.emotional_weight] || '#818CF8'

            // Source point
            let sX = rootX
            let sY = rootY + ROOT_H / 2
            if (belief.parent_id && positions[belief.parent_id]) {
              sX = positions[belief.parent_id].x + NODE_W / 2
              sY = positions[belief.parent_id].y + NODE_H
            }

            // Destination centre-top
            const dX = pos.x + NODE_W / 2
            const dY = pos.y

            const midY = (sY + dY) / 2

            return (
              <path
                key={`ln_${belief.id}`}
                d={`M ${sX} ${sY} C ${sX} ${midY}, ${dX} ${midY}, ${dX} ${dY}`}
                fill="none"
                stroke={color}
                strokeWidth="1.8"
                strokeOpacity="0.3"
                strokeDasharray="6 4"
              />
            )
          })}

          {/* ── Belief nodes ─────────────────────────────────────────────────── */}
          {beliefs.map((belief, i) => {
            const pos     = positions[belief.id]
            if (!pos) return null
            const color   = WEIGHT_COLORS[belief.emotional_weight] || '#818CF8'
            const isHov   = hovered === belief.id

            return (
              <g
                key={belief.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseEnter={() => setHovered(belief.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Card background */}
                <rect
                  width={NODE_W} height={NODE_H} rx="16"
                  fill="#0d1117"
                  stroke={isHov ? color : `${color}55`}
                  strokeWidth={isHov ? 2 : 1.2}
                />

                {/* Corner accent triangle */}
                <path d="M 0 18 A 18 18 0 0 1 18 0 L 50 0 L 0 50 Z"
                  fill={color} opacity="0.08" />

                {/* Number badge */}
                <circle cx="22" cy="22" r="13" fill={`${color}20`} stroke={color} strokeWidth="1" />
                <text x="22" y="27" textAnchor="middle"
                  fill={color} fontSize="11" fontWeight="900" fontFamily="monospace">
                  {i + 1}
                </text>

                {/* Origin meta */}
                <text x="44" y="18"
                  fill={`${color}BB`} fontSize="8.5" fontWeight="700"
                  fontFamily="Inter, sans-serif" letterSpacing="0.5">
                  {belief.origin_year}{belief.origin_year && belief.origin_person ? ' · ' : ''}{belief.origin_person}
                </text>

                {/* Belief text via foreignObject */}
                <foreignObject x="10" y="38" width={NODE_W - 20} height={55}>
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                      fontSize: '10.5px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    &ldquo;{belief.belief}&rdquo;
                  </div>
                </foreignObject>

                {/* Status dot */}
                <circle
                  cx={NODE_W - 14} cy={14} r={5}
                  fill={belief.still_serving === false ? '#22c55e' : '#ef4444'}
                />

                {/* Hover tooltip */}
                {isHov && (
                  <g transform={`translate(0, ${NODE_H + 8})`}>
                    <rect
                      x="-8" y="0" width={NODE_W + 16} height="90" rx="12"
                      fill="rgba(7,10,18,0.96)" stroke={`${color}44`} strokeWidth="1"
                    />
                    <text x="10" y="20"
                      fill="#f87171" fontSize="8.5" fontWeight="900"
                      fontFamily="Inter, sans-serif" letterSpacing="1">
                      THE CORE COST
                    </text>
                    <foreignObject x="10" y="26" width={NODE_W - 4} height="60">
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        style={{
                          fontSize: '10px',
                          color: '#cbd5e1',
                          lineHeight: 1.4,
                          fontStyle: 'italic',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {belief.cost_today}
                      </div>
                    </foreignObject>
                  </g>
                )}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
