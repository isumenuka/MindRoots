'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged } from '@/services/FirebaseService'
import useAppStore from '@/store/useAppStore'
import AppLogo from '@/components/AppLogo'

export default function InterviewPage() {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [user, setLocalUser] = useState(null)

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push('/'); return }
      setLocalUser(u)
      setUser(u)
    })
    return () => unsub()
  }, [router, setUser])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-inter">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]"></div>
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12 border-b border-white/5">
        <AppLogo />
        <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-semibold text-white/70 hover:text-white"
        >
            Back to Home
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl md:text-3xl font-medium text-white max-w-2xl leading-relaxed">
          JavaScript Gemini Live Integration Removed
        </p>
        <p className="text-slate-400 mt-2 text-sm">
          Awaiting alternative backend-driven integration.
        </p>
      </main>
    </div>
  )
}
