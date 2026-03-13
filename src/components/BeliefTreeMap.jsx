'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const NODE_W = 220
const NODE_H = 100
const LEVEL_H = 240
const WEIGHT_COLORS = {
  profound: '#f87171',
  high: '#fb923c',
  medium: '#facc15',
  low: '#4ade80',
}

export default function BeliefTreeMap({ beliefs = [], session = {} }) {
  const containerRef = useRef(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 })
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState(null)

  // ── Hierarchical Layout Algorithm ──────────────────────────────────────────
  // Two-pass: first record (level, orderAtLevel), then center using final counts
  const getLayout = useCallback(() => {
    const nodeMap = {}
    beliefs.forEach(b => nodeMap[b.id] = { ...b, children: [] })

    const roots = []
    beliefs.forEach(node => {
      if (node.parent_id && nodeMap[node.parent_id]) {
        nodeMap[node.parent_id].children.push(node.id)
      } else {
        roots.push(node.id)
      }
    })

    // Pass 1: assign level + order index per level
    const levelOrders = {}   // nodeId -> { level, order }
    const levelCounts = {}   // level  -> total node count

    const walk = (nodeId, level = 0) => {
      if (levelCounts[level] === undefined) levelCounts[level] = 0
      levelOrders[nodeId] = { level, order: levelCounts[level] }
      levelCounts[level]++

      const node = nodeMap[nodeId]
      if (node && node.children) {
        node.children.forEach(childId => walk(childId, level + 1))
      }
    }
    roots.forEach(rootId => walk(rootId, 1))

    // Pass 2: compute centered x positions using final counts
    const positions = {}
    Object.keys(levelOrders).forEach(id => {
      const { level, order } = levelOrders[id]
      const count = levelCounts[level]
      const totalWidth = count * (NODE_W + 60) - 60
      positions[id] = {
        x: order * (NODE_W + 60) - totalWidth / 2 + NODE_W / 2,
        y: level * LEVEL_H,
      }
    })

    return positions
  }, [beliefs])

  const positions = getLayout()
  const rootX = 0
  const rootY = -120

  // ── Interaction Handlers ───────────────────────────────────────────────────
  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      setTransform(prev => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * zoomFactor, 0.1), 3)
      }))
    } else {
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }))
    }
  }

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsDragging(true)
      setLastMouse({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    const dx = e.clientX - lastMouse.x
    const dy = e.clientY - lastMouse.y
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    setLastMouse({ x: e.clientX, y: e.clientY })
  }, [isDragging, lastMouse])

  const handleMouseUp = () => setIsDragging(false)

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove])

  // ── Canvas Controls ────────────────────────────────────────────────────────
  const zoom = (factor) => setTransform(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale * factor, 0.1), 3) }))
  const reset = () => setTransform({ x: 0, y: 0, scale: 0.8 })

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[700px] bg-[#05070a] rounded-2xl border border-white/5 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* ── Floating Nav UI ───────────────────────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">
        <button onClick={() => zoom(1.2)} className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-100 hover:bg-slate-800 transition-all shadow-2xl backdrop-blur-xl group">
          <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">add</span>
        </button>
        <button onClick={() => zoom(0.8)} className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-100 hover:bg-slate-800 transition-all shadow-2xl backdrop-blur-xl group">
          <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">remove</span>
        </button>
        <div className="h-px bg-white/5 mx-2" />
        <button onClick={reset} className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-100 hover:bg-slate-800 transition-all shadow-2xl backdrop-blur-xl group">
          <span className="material-symbols-outlined text-[24px] group-hover:rotate-180 transition-transform duration-500">restart_alt</span>
        </button>
      </div>

      <div className="absolute bottom-6 left-8 z-20 pointer-events-none opacity-40">
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined text-[14px]">mouse</span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nav Control</p>
        </div>
        <p className="text-[9px] text-slate-500 uppercase tracking-widest pl-6">DRAG: Pan • CTRL+SCROLL: Zoom</p>
      </div>

      {/* ── Interactive Canvas ───────────────────────────────────────────────── */}
      <div 
        className="absolute inset-0 transition-transform duration-75 ease-out origin-center"
        style={{ transform: `translate(calc(50% + ${transform.x}px), calc(40% + ${transform.y}px)) scale(${transform.scale})` }}
      >
        <svg width="3000" height="3000" viewBox="-1500 -1500 3000 3000" className="overflow-visible">
          <defs>
            <marker id="dot" markerWidth="6" markerHeight="6" refX="3" refY="3">
              <circle cx="3" cy="3" r="2" fill="#818CF8" opacity="0.4" />
            </marker>
          </defs>

          {/* ── Root Concept ─────────────────────────────────────────── */}
          <g transform={`translate(${rootX - 120}, ${rootY - 45})`}>
            <rect width="240" height="90" rx="45" fill="#1e293b" stroke="#818CF8" strokeWidth="2" strokeDasharray="5 5" />
            <text x="120" y="35" textAnchor="middle" fill="#818CF8" className="text-[10px] font-black uppercase tracking-[0.2em]">MindRoots Origin</text>
            <text x="120" y="58" textAnchor="middle" fill="white" className="text-[15px] font-black">
              {session?.dominant_theme?.slice(0, 22) || 'Your Core Theme'}
              {session?.dominant_theme?.length > 22 ? '...' : ''}
            </text>
          </g>

          {/* ── Hierarchy Lines ─────────────────────────────────────── */}
          {beliefs.map((belief) => {
            const pos = positions[belief.id] || { x: 0, y: 0 }
            let sX = rootX, sY = rootY + 45
            
            if (belief.parent_id && positions[belief.parent_id]) {
              sX = positions[belief.parent_id].x
              sY = positions[belief.parent_id].y + NODE_H / 2
            }

            const color = WEIGHT_COLORS[belief.emotional_weight] || '#818CF8'
            return (
              <path
                key={`line_${belief.id}`}
                d={`M ${sX} ${sY} C ${sX} ${sY + (pos.y - sY) * 0.4}, ${pos.x} ${pos.y - (pos.y - sY) * 0.6}, ${pos.x} ${pos.y - NODE_H / 2}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeOpacity="0.25"
                strokeDasharray="6 4"
                markerStart={!belief.parent_id ? "url(#dot)" : ""}
              />
            )
          })}

          {/* ── Belief Nodes ──────────────────────────────────────────── */}
          {beliefs.map((belief, i) => {
            const pos = positions[belief.id] || { x: 0, y: 0 }
            const color = WEIGHT_COLORS[belief.emotional_weight] || '#818CF8'
            const isHovered = hoveredNode === belief.id

            return (
              <g 
                key={belief.id} 
                transform={`translate(${pos.x - NODE_W / 2}, ${pos.y - NODE_H / 2})`}
                onMouseEnter={() => setHoveredNode(belief.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* Visual Card */}
                <rect 
                  width={NODE_W} height={NODE_H} rx="20" 
                  fill="#0d1117" stroke={isHovered ? color : `${color}44`} strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-300"
                />
                
                {/* Weight Accent */}
                <path d={`M 0 20 A 20 20 0 0 1 20 0 L 60 0 L 0 60 Z`} fill={color} opacity="0.1" />
                <circle cx="20" cy="20" r="12" fill={`${color}22`} stroke={color} strokeWidth="1" />
                <text x="20" y="24" textAnchor="middle" fill={color} className="text-[10px] font-black font-mono">
                  {i + 1}
                </text>

                {/* Meta text */}
                <text x="45" y="22" fill={`${color}AA`} className="text-[9px] font-black uppercase tracking-widest">
                  {belief.origin_year} • {belief.origin_person}
                </text>

                {/* Belief Statement */}
                <foreignObject x="20" y="42" width={NODE_W - 40} height={45}>
                  <div className={`text-[11px] font-bold text-slate-100 leading-tight ${isHovered ? '' : 'line-clamp-2'}`}>
                    "{belief.belief}"
                  </div>
                </foreignObject>

                {/* Status Indicator */}
                <circle cx={NODE_W - 20} cy="20" r="5" fill={belief.still_serving ? '#ef4444' : '#22c55e'} />

                {/* Tooltip Overlay */}
                {isHovered && (
                  <g transform={`translate(0, ${NODE_H + 12})`}>
                    <rect width={NODE_W + 40} x="-20" height="auto" rx="12" fill="rgba(7,10,16,0.95)" stroke={`${color}44`} className="backdrop-blur-xl" />
                    <foreignObject x="-10" y="10" width={NODE_W + 20} height="100">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">The Core Cost</p>
                        <p className="text-[10px] text-slate-300 leading-snug italic font-medium">
                          {belief.cost_today}
                        </p>
                      </div>
                    </foreignObject>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
