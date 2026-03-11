'use client'
import { useEffect, useState } from 'react'

const STAGES = [
  {
    labelDone: 'Agent 1 complete', labelActive: 'Agent 1 running', labelPending: 'Agent 1 pending',
    descDone: 'Your beliefs have been excavated', descActive: 'Excavating your beliefs...', descPending: 'Awaiting excavation',
  },
  {
    labelDone: 'Agent 2 complete', labelActive: 'Agent 2 running', labelPending: 'Agent 2 pending',
    descDone: 'Belief map structured', descActive: 'Structuring your belief map...', descPending: 'Awaiting structuring',
  },
  {
    labelDone: 'Agent 3 complete', labelActive: 'Agent 3 running', labelPending: 'Agent 3 pending',
    descDone: 'Illustrations generated', descActive: 'Generating your illustrations...', descPending: 'Awaiting generation',
  },
  {
    labelDone: 'Narration recorded', labelActive: 'Recording narration...', labelPending: 'Recording narration...',
    descDone: 'Story woven together', descActive: 'Weaving your story...', descPending: 'Awaiting processing',
  },
  {
    labelDone: 'Belief Origin Tree ready', labelActive: 'Drawing your Belief Origin Tree...', labelPending: 'Drawing your Belief Origin Tree...',
    descDone: 'Final composition complete', descActive: 'Final sequence...', descPending: 'Final sequence',
  },
]

const STATUS_TO_STAGE = {
  interviewing:        0,
  structuring:         1,
  structuring_complete: 2,
  generating_images:   2,
  generating_audio:    3,
  generating_pdf:      4,
  complete:            5,
}

export default function ProcessingStages({ sessionStatus }) {
  const currentStage = STATUS_TO_STAGE[sessionStatus] ?? 0

  return (
    <div className="space-y-0 relative">
      {/* Vertical connector line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-[1px] bg-white/10" />

      {STAGES.map((stage, i) => {
        const isDone    = i < currentStage
        const isActive  = i === currentStage - 1 || (currentStage === 0 && i === 0)
        const isPending = !isDone && !isActive

        return (
          <div key={i} className={`relative flex gap-6 ${i < STAGES.length - 1 ? 'pb-10' : ''} group`}>
            {/* Stage icon */}
            <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${
              isDone
                ? 'bg-accent/20 border border-accent/40 text-accent'
                : isActive
                ? 'bg-white border-2 border-white text-[#0A0A0A] shadow-[0_0_24px_rgba(129,140,248,0.4)]'
                : 'bg-transparent border border-white/10 text-white/20'
            }`}>
              {isDone ? (
                <span className="material-symbols-outlined text-xl">check</span>
              ) : isActive ? (
                <span className="material-symbols-outlined text-xl animate-spin" style={{ animationDuration: '1.2s' }}>
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-xl">radio_button_unchecked</span>
              )}
            </div>

            {/* Stage text */}
            <div className="flex flex-col justify-center">
              <h3 className={`font-outfit font-semibold text-base leading-tight tracking-tight transition-colors duration-300 ${
                isDone    ? 'text-white'
                : isActive ? 'text-white'
                : 'text-white/25'
              }`}>
                {isDone ? stage.labelDone : isActive ? stage.labelActive : stage.labelPending}
              </h3>
              <p className={`font-inter text-sm mt-0.5 transition-colors duration-300 ${
                isDone    ? 'text-slate-400'
                : isActive ? 'text-[#818CF8]'
                : 'text-white/15'
              }`}>
                {isDone ? stage.descDone : isActive ? stage.descActive : stage.descPending}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
