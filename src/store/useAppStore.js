/**
 * useAppStore.js — Zustand global store
 */
import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Onboarding
  onboardingComplete: false,
  setOnboardingComplete: (val) => set({ onboardingComplete: val }),

  // Current session
  sessionId: null,
  setSessionId: (sessionId) => set({ sessionId }),

  // Beliefs discovered during interview
  beliefs: [],
  addBelief: (belief) => set((state) => ({ beliefs: [...state.beliefs, belief] })),
  resetBeliefs: () => set({ beliefs: [] }),

  // Processing pipeline stage (1-5)
  processingStage: 0,
  setProcessingStage: (stage) => set({ processingStage: stage }),

  // Session data (full belief tree from Firestore)
  beliefTree: null,
  setBeliefTree: (tree) => set({ beliefTree: tree }),

  // Interview state
  isInterviewing: false,
  setIsInterviewing: (val) => set({ isInterviewing: val }),

  // Transcript
  transcript: [],
  addTranscriptEntry: (entry) => set((state) => ({ transcript: [...state.transcript, entry] })),
  clearTranscript: () => set({ transcript: [] }),

  // Reset everything for new session
  startNewSession: () => set({
    sessionId: null,
    beliefs: [],
    processingStage: 0,
    beliefTree: null,
    isInterviewing: false,
    transcript: [],
  }),
}))

export default useAppStore
