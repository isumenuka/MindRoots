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

const getNodeDisplayInfo = (node) => {
  const type = node.node_type || 'BELIEF_NODE'
  switch (type) {
    case 'BELIEF_NODE': 
      return { 
        title: 'Core Belief', color: '#818CF8', 
        subtitle: `${node.origin_year || ''}${node.origin_year && node.origin_person ? ' • ' : ''}${node.origin_person || ''}`,
        text: node.belief, 
        tooltip1Title: 'THE CORE COST', tooltip1Val: node.cost_today,
        tooltip2Title: 'MODERN TRIGGER', tooltip2Val: node.trigger_event
      };
    case 'BLOCKER_NODE': 
      return { 
        title: 'Goal Blocker', color: '#F87171', subtitle: 'Current Obstacle',
        text: node.target_goal, 
        tooltip1Title: 'PERCEIVED OBSTACLE', tooltip1Val: node.perceived_obstacle
      };
    case 'CRITIC_PERSONA_NODE': 
      return { 
        title: 'Inner Critic', color: '#FBBF24', subtitle: `"${node.persona_name}"`,
        text: node.common_catchphrases, 
        tooltip1Title: 'PRIMARY UNDERLYING FEAR', tooltip1Val: node.primary_underlying_fear
      };
    case 'COPING_STRATEGY_NODE': 
      return { 
        title: 'Coping Strategy', color: '#34D399', subtitle: `Health Rating: ${node.healthiness_rating || '?'}`,
        text: node.coping_behavior, 
        tooltip1Title: 'TRIGGER SITUATION', tooltip1Val: node.trigger_situation
      };
    case 'VALUE_NODE': 
      return { 
        title: 'Core Value', color: '#60A5FA', subtitle: `Importance: ${node.importance_level || '?'}`,
        text: node.value_name, 
        tooltip1Title: 'CURRENT ALIGNMENT', tooltip1Val: node.current_alignment_status
      };
    case 'STRENGTH_NODE': 
      return { 
        title: 'Strength Marker', color: '#A78BFA', subtitle: 'Inherent Strength',
        text: node.strength_name, 
        tooltip1Title: 'DEMONSTRATED SCENARIO', tooltip1Val: node.demonstrated_scenario,
        tooltip2Title: 'RELATED BELIEF OVERCOME', tooltip2Val: node.related_belief_overcome
      };
    case 'RELATIONSHIP_PATTERN_NODE': 
      return { 
        title: 'Relational Pattern', color: '#F472B6', subtitle: 'Interpersonal Dynamics',
        text: node.pattern_description, 
        tooltip1Title: 'TYPICAL ROLE PLAYED', tooltip1Val: node.typical_role_played
      };
    case 'FUTURE_VISION_NODE': 
      return { 
        title: 'Future Vision', color: '#2DD4BF', subtitle: 'Ideal Self',
        text: node.envisioned_scenario, 
        tooltip1Title: 'CHANGED BEHAVIOR', tooltip1Val: node.changed_behavior,
        tooltip2Title: 'NEW FEELING', tooltip2Val: node.new_feeling
      };
    case 'TRIGGER_NODE': 
      return { 
        title: 'Emotional Trigger', color: '#FB923C', subtitle: `Intensity: ${node.reaction_intensity || '?'}`,
        text: node.trigger_description, 
        tooltip1Title: 'PHYSICAL RESPONSE', tooltip1Val: node.physical_response
      };
    case 'ACTION_STEP_NODE': 
      return { 
        title: 'Action Step', color: '#A3E635', subtitle: `Deadline: ${node.target_deadline || '?'}`,
        text: node.specific_action, 
        tooltip1Title: 'CONFIDENCE LEVEL', tooltip1Val: `${node.user_confidence_level || '?'}/10`
      };
    case 'SESSION_METRIC_NODE': 
      return { 
        title: 'Session Metric', color: '#9CA3AF', subtitle: `Shift: ${node.primary_emotion_shift || '?'}`,
        text: `From ${node.starting_energy_level} to ${node.ending_energy_level}`, 
      };
    default: 
      return { 
        title: 'New Insight', color: '#818CF8', subtitle: '',
        text: node.belief || JSON.stringify(node), 
      };
  }
}

// ── Custom React Flow Nodes ──────────────────────────────────────────────
const BeliefNode = ({ data, selected }) => {
  const { belief: nodeData, index } = data
  const info = getNodeDisplayInfo(nodeData)
  const isServing = nodeData.still_serving === false ? false : (nodeData.still_serving === true ? true : null)
  const nodeColor = info.color

  return (
    <div className={`relative w-[260px] rounded-2xl bg-[#0d1117] transition-all shadow-xl group border-2 ${selected ? 'shadow-[0_0_20px_rgba(255,255,255,0.2)]' : ''}`} style={{ borderColor: selected ? nodeColor : `${nodeColor}66` }}>
      <Handle type="target" position={Position.Top} style={{ background: nodeColor, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: nodeColor, width: 8, height: 8 }} />
      
      {/* Corner accent triangle */}
      <div className="absolute top-0 left-0 w-10 h-10 pointer-events-none overflow-hidden rounded-tl-xl">
        <div className="absolute -top-5 -left-5 w-14 h-14 rotate-45" style={{ backgroundColor: nodeColor, opacity: 0.15 }}></div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: `${nodeColor}20`, color: nodeColor, border: `1px solid ${nodeColor}` }}>
               {index + 1}
             </div>
             <div className="flex flex-col">
               <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: `${nodeColor}BB` }}>
                 {info.title}
               </div>
               {info.subtitle && (
                 <div className="text-[9px] uppercase tracking-wider text-slate-400">
                   {info.subtitle}
                 </div>
               )}
             </div>
           </div>
           {isServing === false ? (
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Processed/No longer serving" />
           ) : isServing === true ? (
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" title="Still active/serving" />
           ) : null}
        </div>
        <div className="text-[13px] font-medium text-slate-200 line-clamp-3 leading-relaxed font-body">
          &ldquo;{info.text}&rdquo;
        </div>
      </div>
      
      {/* Tooltip on hover */}
      {(info.tooltip1Val || info.tooltip2Val) && (
        <div className="absolute top-full left-0 mt-4 w-[280px] bg-[#070a12] border border-white/10 rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
            {info.tooltip1Val && (
              <>
                <div className="text-[10px] font-black tracking-widest mb-1.5" style={{ color: nodeColor }}>{info.tooltip1Title}</div>
                <div className="text-xs text-slate-300 italic mb-3 leading-snug">{info.tooltip1Val}</div>
              </>
            )}
            {info.tooltip2Val && (
               <>
                  <div className="text-[10px] font-black tracking-widest mb-1.5 mt-2" style={{ color: nodeColor }}>{info.tooltip2Title}</div>
                  <div className="text-xs text-slate-400 leading-snug">{info.tooltip2Val}</div>
               </>
            )}
        </div>
      )}
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
       const infoColor = getNodeDisplayInfo(belief).color
       const color = WEIGHT_COLORS[belief.emotional_weight] || infoColor || '#818CF8'
       
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
