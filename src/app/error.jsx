'use client'
import Link from 'next/link'
import AppLogo from '@/components/AppLogo'

export default function ErrorPage({ error, reset }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/6 rounded-full blur-[120px]" />
      </div>
      <nav className="relative z-10 px-6 h-16 flex items-center border-b border-white/5">
        <AppLogo />
      </nav>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-red-400 text-[32px]">error</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-2">
          An unexpected error occurred. If you were in a session, your beliefs were auto-saved.
        </p>
        {error?.message && (
          <p className="text-xs text-slate-600 font-mono mb-8 bg-white/5 rounded-lg px-4 py-2 border border-white/5 max-w-xs">
            {error.message}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => reset()} className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Try Again
          </button>
          <Link href="/" className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[18px]">home</span>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
