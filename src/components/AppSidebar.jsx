'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import AppLogo from '@/components/AppLogo'

/**
 * Shared app sidebar — used on History and Settings pages.
 * Props:
 *  - user: Firebase auth user object
 *  - activeTab: for settings tabs ('profile' | 'privacy')
 *  - onTabChange: fn(tab) — called when Profile/Privacy nav item clicked
 *  - onSignOut: fn() — called when Sign Out clicked
 *  - signingOut: boolean
 */
export default function AppSidebar({ user, activeTab, onTabChange, onSignOut, signingOut }) {
  const pathname = usePathname()
  const router = useRouter()

  const isHistory = pathname === '/history'
  const isSettings = pathname === '/settings'

  const handleTab = (tab) => {
    if (isSettings && onTabChange) {
      onTabChange(tab)
    } else {
      router.push(`/settings?tab=${tab}`)
    }
  }

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#0A0A0A] h-full">
      {/* Logo */}
      <div className="p-5 pb-4 border-b border-white/5">
        <AppLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-2">

        {/* Home */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-all text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          Home
        </Link>

        {/* Session History */}
        <Link
          href="/history"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
            isHistory
              ? 'bg-[#818CF8]/15 text-[#818CF8]'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">history</span>
          Session History
        </Link>

        {/* Archives */}
        <Link
          href="/history"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
            isHistory
              ? 'bg-[#818CF8]/15 text-[#818CF8]'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">folder_open</span>
          Archives
        </Link>

        {/* Insights */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 text-sm font-medium cursor-not-allowed select-none">
          <span className="material-symbols-outlined text-[20px]">insights</span>
          <span>Insights</span>
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-500 px-1.5 py-0.5 rounded">Soon</span>
        </div>

        <div className="pt-3 pb-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Account</p>
        </div>

        {/* Profile */}
        <button
          onClick={() => handleTab('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
            isSettings && activeTab === 'profile'
              ? 'bg-[#818CF8]/15 text-[#818CF8]'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">person</span>
          Profile
        </button>

        {/* Privacy */}
        <button
          onClick={() => handleTab('privacy')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
            isSettings && activeTab === 'privacy'
              ? 'bg-[#818CF8]/15 text-[#818CF8]'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">shield_lock</span>
          Privacy
        </button>

      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-white/5">
        {/* User chip */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl bg-white/[0.03]">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
              )}
            </div>
            <span className="text-xs text-slate-300 font-medium truncate">{user.displayName || user.email}</span>
          </div>
        )}
        <button
          onClick={onSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all text-sm font-medium disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </aside>
  )
}
