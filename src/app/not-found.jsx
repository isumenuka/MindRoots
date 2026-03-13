import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#818CF8]/4 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Giant 404 */}
        <div className="select-none mb-6">
          <p className="font-display font-black text-[120px] md:text-[160px] leading-none bg-clip-text text-transparent bg-gradient-to-br from-[#818CF8]/40 to-[#818CF8]/5">
            404
          </p>
        </div>

        <h1 className="text-2xl font-display font-bold text-white mb-3 tracking-tight">
          Page not found
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-xs mx-auto">
          This page doesn&apos;t exist or may have been moved. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors shadow-lg shadow-white/10"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Back to Home
          </Link>
          <Link
            href="/history"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-slate-200 font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
            My Sessions
          </Link>
        </div>

        <p className="mt-12 text-[11px] text-slate-700 uppercase tracking-widest font-semibold">MindRoots</p>
      </div>
    </div>
  )
}
