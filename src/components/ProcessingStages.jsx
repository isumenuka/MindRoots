'use client'

const STAGES = [
  { labelDone: 'Agent 1 complete', labelActive: 'Agent 1 active', labelPending: 'Agent 1 pending', descDone: 'Your beliefs have been excavated', descActive: 'Excavating your beliefs...', descPending: 'Awaiting' },
  { labelDone: 'Agent 2 complete', labelActive: 'Agent 2 active', labelPending: 'Agent 2 pending', descDone: 'Structuring your belief map', descActive: 'Structuring your belief map...', descPending: 'Awaiting structuring' },
  { labelDone: 'Agent 3 complete', labelActive: 'Agent 3 active', labelPending: 'Agent 3 pending', descDone: 'Illustrations generated', descActive: 'Generating your illustrations...', descPending: 'Awaiting generation' },
  { labelDone: 'Narration recorded', labelActive: 'Recording narration...', labelPending: 'Recording narration...', descDone: 'Story woven together', descActive: 'Weaving your story together...', descPending: 'Awaiting processing' },
  { labelDone: 'Belief Origin Tree ready', labelActive: 'Drawing your Belief Origin Tree...', labelPending: 'Drawing your Belief Origin Tree...', descDone: 'Final composition complete', descActive: 'Final sequence...', descPending: 'Final sequence' },
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
            <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all ${
              isDone
                ? 'bg-accent/20 border border-accent/30 text-accent'
                : isActive
                ? 'bg-primary border border-primary text-background-dark shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : 'bg-transparent border border-dim text-dim'
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
            <div className="flex flex-col">
              <h3 className={`font-medium text-lg leading-tight ${
                isDone ? 'text-primary' : isActive ? 'text-primary font-semibold' : 'text-dim'
              }`}>
                {isDone ? stage.labelDone : isActive ? stage.labelActive : stage.labelPending}
              </h3>
              <p className={`${
                isDone ? 'text-muted' : isActive ? 'text-primary/80' : 'text-dim/60'
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
