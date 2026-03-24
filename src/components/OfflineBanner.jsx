'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * OfflineBanner — shows an amber warning strip when the browser loses internet.
 * Mount this once in layout.js so it appears on every page.
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const [showBackOnline, setShowBackOnline] = useState(false)

  useEffect(() => {
    // Initialise from current state (SSR safe guard)
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setWasOffline(true)
      setShowBackOnline(false)
    }
    const handleOnline = () => {
      setIsOffline(false)
      if (wasOffline) {
        setShowBackOnline(true)
        setTimeout(() => setShowBackOnline(false), 3000)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [wasOffline])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500/95 backdrop-blur-sm text-amber-950 text-sm font-semibold shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">wifi_off</span>
          <span>You're offline — your data is saved locally and will sync when reconnected.</span>
        </motion.div>
      )}
      {showBackOnline && !isOffline && (
        <motion.div
          key="online"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500/95 backdrop-blur-sm text-emerald-950 text-sm font-semibold shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">wifi</span>
          <span>Back online — syncing your data…</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
