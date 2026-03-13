'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[MindRoots] Unhandled error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-[#0A0A0A] min-h-screen flex items-center justify-center p-6 font-sans">
        {/* Ambient */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-500/5 blur-[140px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#818CF8]/4 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 text-center max-w-md w-full">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-400">error</span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-3 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            An unexpected error occurred. Your data is safe — this is a temporary glitch.
          </p>

          {/* Error message (dev only) */}
          {error?.message && process.env.NODE_ENV !== 'production' && (
            <div className="mb-6 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left">
              <p className="text-xs font-mono text-slate-500 break-all leading-relaxed">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#818CF8] text-white font-bold text-sm rounded-xl hover:bg-[#818CF8]/90 transition-colors shadow-lg shadow-[#818CF8]/20"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Try Again
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-slate-200 font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              Go Home
            </Link>
          </div>

          <p className="mt-10 text-[11px] text-slate-700 uppercase tracking-widest font-semibold">MindRoots</p>
        </div>

        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
      </body>
    </html>
  )
}
