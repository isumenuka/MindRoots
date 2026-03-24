import Link from 'next/link'
import AppLogo from '@/components/AppLogo'

export const metadata = {
  title: 'Page Not Found — MindRoots',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-[#818CF8]/4 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <nav className="relative z-10 px-6 h-16 flex items-center border-b border-white/5">
        <AppLogo />
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#818CF8]/10 border border-[#818CF8]/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-[#818CF8] text-[32px]">search_off</span>
        </div>
        <p className="text-7xl font-display font-black text-white/10 mb-4">404</p>
        <h1 className="text-2xl font-display font-bold text-white mb-3">Page not found</h1>
        <p className="text-slate-400 text-sm max-w-xs mb-8">
          This page doesn&apos;t exist or was moved. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-[18px]">home</span>
            Go Home
          </Link>
          <Link href="/history" className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
            My Sessions
          </Link>
        </div>
      </div>
    </div>
  )
}
