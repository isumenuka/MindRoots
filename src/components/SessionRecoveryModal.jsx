'use client'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * SessionRecoveryModal
 * Shown on interview page mount when a draft exists in localStorage.
 * Lets the user resume the previous session or start fresh.
 */
export default function SessionRecoveryModal({ draftData, onResume, onDiscard }) {
  if (!draftData) return null

  const savedAt = draftData.savedAt
    ? new Date(draftData.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'recently'

  const beliefCount = draftData.beliefs?.length || 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[#818CF8]/10 border border-[#818CF8]/20 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-[#818CF8] text-[28px]">history</span>
          </div>

          <h2 className="text-xl font-display font-bold text-white mb-2">
            Unfinished Session Found
          </h2>
          <p className="text-slate-400 text-sm mb-1">
            An interview session from <span className="text-slate-300 font-semibold">{savedAt}</span> was interrupted.
          </p>
          {beliefCount > 0 && (
            <p className="text-slate-500 text-sm mb-6">
              <span className="text-[#818CF8] font-bold">{beliefCount} belief{beliefCount !== 1 ? 's' : ''}</span> were already excavated.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={onResume}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#818CF8] text-white font-bold rounded-xl hover:bg-[#818CF8]/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              Resume Session
            </button>
            <button
              onClick={onDiscard}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 border border-white/10 text-slate-400 font-semibold rounded-xl hover:bg-white/10 hover:text-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Start Fresh
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
