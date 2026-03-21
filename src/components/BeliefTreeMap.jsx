'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, Handle, Position, addEdge, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const NODE_W = 260
const NODE_H = 130
const GAP_X  = 60
const LEVEL_H = 220
const WEIGHT_COLORS = {
  profound: '#f87171',
  high:     '#fb923c',
  medium:   '#facc15',
  low:      '#4ade80',
}

// ── Custom React Flow Nodes ──────────────────────────────────────────────
const BeliefNode = ({ data, selected }) => {
  const { belief, index, color } = data
  return (
    <div className={`relative w-[260px] rounded-2xl bg-[#0d1117] transition-all shadow-xl group border-2 ${selected ? 'shadow-[0_0_20px_rgba(255,255,255,0.2)]' : ''}`} style={{ borderColor: selected ? color : `${color}66` }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: color, width: 8, height: 8 }} />
      
      {/* Corner accent triangle */}
      <div className="absolute top-0 left-0 w-10 h-10 pointer-events-none overflow-hidden rounded-tl-xl">
        <div className="absolute -top-5 -left-5 w-14 h-14 rotate-45" style={{ backgroundColor: color, opacity: 0.15 }}></div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}` }}>
               {index + 1}
             </div>
             <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: `${color}BB` }}>
               {belief.origin_year}{belief.origin_year && belief.origin_person ? ' • ' : ''}{belief.origin_person}
             </div>
           </div>
           {belief.still_serving === false ? (
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Processed/No longer serving" />
           ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" title="Still active/serving" />
           )}
        </div>
        <div className="text-[13px] font-medium text-slate-200 line-clamp-3 leading-relaxed font-body">
          &ldquo;{belief.belief}&rdquo;
        </div>
      </div>
      
      {/* Tooltip on hover (done via group-hover inside the flow) */}
      <div className="absolute top-full left-0 mt-4 w-[280px] bg-[#070a12] border border-white/10 rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
          <div className="text-[10px] font-black tracking-widest text-red-400 mb-1.5">THE CORE COST</div>
          <div className="text-xs text-slate-300 italic mb-3 leading-snug">{belief.cost_today}</div>
          {belief.trigger_event && (
             <>
                <div className="text-[10px] font-black tracking-widest text-[#818CF8] mb-1.5 mt-2">MODERN TRIGGER</div>
                <div className="text-xs text-slate-400 leading-snug">{belief.trigger_event}</div>
             </>
          )}
      </div>
    </div>
  )
}

const RootNode = ({ data, selected }) => {
  return (
    <div className={`relative w-[280px] rounded-2xl bg-[#1e2a3a] border-2 border-dashed shadow-2xl p-5 text-center transition-all ${selected ? 'border-[#818CF8] shadow-[0_0_30px_rgba(129,140,248,0.4)]' : 'border-[#818CF8]/60 shadow-[0_0_20px_rgba(129,140,248,0.15)]'}`}>
      <Handle type="source" position={Position.Bottom} style={{ background: '#818CF8', width: 8, height: 8 }} />
      <div className="text-[11px] font-black text-[#818CF8] tracking-[0.25em] mb-2 uppercase">MindRoots Origin</div>
      <div className="text-base font-bold text-white font-display">
        {data.theme}
      </div>
    </div>
  )
}

const nodeTypes = {
  belief: BeliefNode,
  root: RootNode
}

export default function BeliefTreeMap({ beliefs = [], session = {} }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  
  useEffect(() => {
    if (!beliefs.length) return

    // 1. Build adjacency & find roots
    const nodeMap = {}
    beliefs.forEach(b => { nodeMap[b.id] = { ...b, children: [] } })
    const rootNodes = []
    beliefs.forEach(n => {
      if (n.parent_id && nodeMap[n.parent_id]) {
        nodeMap[n.parent_id].children.push(n.id)
      } else {
        rootNodes.push(n.id)
      }
    })

    // 2. Pass 1 – BFS to record level + order
    const levelOrders = {}
    const levelCounts = {}
    const bfs = (id, lvl) => {
      levelCounts[lvl] = (levelCounts[lvl] || 0)
      levelOrders[id]  = { level: lvl, order: levelCounts[lvl] }
      levelCounts[lvl]++
      const n = nodeMap[id]
      if (n?.children) n.children.forEach(c => bfs(c, lvl + 1))
    }
    rootNodes.forEach(r => bfs(r, 1))

    // 3. Pass 2 – compute positions
    const posMap = {}
    Object.keys(levelOrders).forEach(id => {
      const { level, order } = levelOrders[id]
      const count      = levelCounts[level]
      const totalWidth = count * (NODE_W + GAP_X) - GAP_X
      posMap[id] = {
        x: order * (NODE_W + GAP_X) - totalWidth / 2,
        y: level * LEVEL_H,
      }
    })

    // 4. Create React Flow elements
    const initialNodes = []
    const initialEdges = []

    // Root node
    initialNodes.push({
      id: 'root',
      type: 'root',
      position: { x: -NODE_W / 2, y: 0 },
      data: { theme: session?.dominant_theme || 'Your Core Theme' }
    })

    beliefs.forEach((belief, i) => {
       const parent = belief.parent_id || 'root'
       const color = WEIGHT_COLORS[belief.emotional_weight] || '#818CF8'
       
       initialEdges.push({
         id: `e-${parent}-${belief.id}`,
         source: String(parent),
         target: String(belief.id),
         type: 'smoothstep',
         animated: true,
         style: { stroke: color, strokeWidth: 2, opacity: 0.7 },
       })

       const pos = posMap[belief.id] || { x: i * 200, y: (i + 1) * 200 }
       initialNodes.push({
         id: String(belief.id),
         type: 'belief',
         position: { x: pos.x - NODE_W / 2 + 100, y: pos.y },
         data: { belief, index: i, color }
       })
    })

    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [beliefs, session, setNodes, setEdges])

  return (
    <div className="w-full h-[680px] bg-[#05070a] rounded-2xl border border-white/5 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ zIndex: 0 }}
        >
          <Background color="#ffffff" gap={20} size={1} opacity={0.05} />
          <Controls className="!bg-[#0f1117] !border-[#818CF8]/20 !shadow-[0_0_15px_rgba(129,140,248,0.1)] !rounded-lg [&>button]:!border-b-[#818CF8]/10 [&>button]:!text-slate-300 [&>button]:!bg-transparent hover:[&>button]:!bg-[#818CF8]/10" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'root') return '#818CF8';
              return n.data?.color || '#333';
            }}
            nodeStrokeColor={(n) => {
                if (n.type === 'root') return '#818CF8';
                return n.data?.color || '#333';
            }}
            nodeBorderRadius={8}
            className="!bg-[#0f1117] !border-[#818CF8]/20 !shadow-xl !rounded-xl"
            maskColor="rgba(5, 7, 10, 0.7)"
          />
        </ReactFlow>
    </div>
  )
}
