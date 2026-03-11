import Link from 'next/link'

/**
 * Shared MindRoots logo component.
 * Usage: <AppLogo /> or <AppLogo href="/settings" />
 */
export default function AppLogo({ href = '/', className = '' }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 hover:opacity-80 transition-opacity group ${className}`}>
      <div className="w-9 h-9 bg-[#818CF8] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(129,140,248,0.35)] group-hover:shadow-[0_0_28px_rgba(129,140,248,0.5)] transition-shadow">
        <span className="material-symbols-outlined text-white font-bold text-xl leading-none">psychology</span>
      </div>
      <span className="font-display text-xl font-bold tracking-tight text-white">MindRoots</span>
    </Link>
  )
}
