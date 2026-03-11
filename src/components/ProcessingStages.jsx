'use client'

const STAGES = [
  { label: 'Agent 1 complete', desc: 'Your beliefs have been excavated' },
  { label: 'Agent 2 at work', desc: 'Structuring your belief map...' },
  { label: 'Agent 3 — Generating illustrations', desc: 'Creating your visual memory...' },
  { label: 'Recording narration', desc: 'Weaving your story together...' },
  { label: 'Drawing your Belief Origin Tree', desc: 'Final composition...' },
]

const STATUS_TO_STAGE = {
  interviewing: 0,
  structuring: 1,
  structuring_complete: 2,
  generating_images: 2,
  generating_audio: 3,
  generating_pdf: 4,
  complete: 5,
}

export default function ProcessingStages({ sessionStatus }) {
  const currentStage = STATUS_TO_STAGE[sessionStatus] ?? 0

  return (
    <div className="space-y-0 relative">
      {/* Vertical connector line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-[1px] bg-white/10" />

      {STAGES.map((stage, i) => {
        const isDone = i < currentStage
        const isActive = i === currentStage - 1 || (currentStage === 0 && i === 0)
        const isPending = i >= currentStage

        return (
          <div key={i} className={`relative flex gap-6 ${i < STAGES.length - 1 ? 'pb-10' : ''} group`}>
            {/* Stage icon */}
            <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border transition-all ${
              isDone
                ? 'bg-[#818CF8]/20 border-[#818CF8]/30 text-[#818CF8]'
                : isActive
                ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : 'bg-transparent border-white/20 text-white/20'
            }`}>
              {isDone ? (
                <span className="material-symbols-outlined text-xl">check</span>
              ) : isActive ? (
                <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-xl">radio_button_unchecked</span>
              )}
            </div>

            {/* Stage text */}
            <div className="flex flex-col justify-center">
              <h3 className={`font-medium text-lg leading-tight ${
                isDone ? 'text-white/70' : isActive ? 'text-white font-semibold' : 'text-white/20'
              }`}>
                {stage.label}
              </h3>
              <p className={`text-sm ${
                isDone ? 'text-white/40' : isActive ? 'text-[#818CF8]/80' : 'text-white/10'
              }`}>
                {isDone ? '✓ Complete' : stage.desc}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
