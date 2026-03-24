/**
 * useSessionRecovery
 * Provides auto-save and restore of interview session state via localStorage.
 *
 * Usage:
 *   const { saveDraft, clearDraft, hasDraft, draftData } = useSessionRecovery()
 *
 * Call saveDraft() on every new belief and every 30s.
 * Call clearDraft() when session ends cleanly.
 * On mount, check hasDraft to offer restoration.
 */

const STORAGE_KEY = 'mindroots_session_draft'
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function useSessionRecovery() {
  const saveDraft = (data) => {
    if (typeof window === 'undefined') return
    try {
      const payload = {
        ...data,
        savedAt: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (e) {
      console.warn('[SessionRecovery] Failed to save draft:', e)
    }
  }

  const clearDraft = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('[SessionRecovery] Failed to clear draft:', e)
    }
  }

  const getDraft = () => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw)
      // Expire drafts older than 24h
      if (Date.now() - data.savedAt > DRAFT_TTL_MS) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      return data
    } catch (e) {
      return null
    }
  }

  const draftData = getDraft()
  const hasDraft = draftData !== null && (
    (draftData.beliefs?.length > 0) ||
    (draftData.transcript?.length > 0)
  )

  return { saveDraft, clearDraft, hasDraft, draftData }
}
