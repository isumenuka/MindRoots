'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLogo from '@/components/AppLogo'

/**
 * AppSidebar
 * ─ Desktop (md+): fixed vertical sidebar
 * ─ Mobile (<md):  hamburger button (top-left, fixed) + slide-in drawer + dark overlay
 */
export default function AppSidebar({ user, activeTab, onTabChange, onSignOut, signingOut }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isHistory  = pathname === '/history'
  const isSettings = pathname === '/settings'
  const isInsights = pathname === '/insights'

  const handleTab = (tab) => {
    if (isSettings && onTabChange) {
      onTabChange(tab)
    } else {
      router.push(`/settings?tab=${tab}`)
    }
    setDrawerOpen(false)
  }

  const close = () => setDrawerOpen(false)

  // ── shared nav items ──────────────────────────────────────────────────────
  const NavContent = ({ onClose }) => (
    <>
      {/* Logo */}
      <div className="p-5 pb-4 border-b border-white/5 flex items-center justify-between">
        <AppLogo />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5 mt-2 overflow-y-auto">

        {/* Home */}
        <Link
          href="/"
          onClick={close}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-all text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          Home
        </Link>

        {/* Archives */}
        <Link
          href="/history"
          onClick={close}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
            isHistory ? 'bg-[#818CF8]/15 text-[#818CF8]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">folder_open</span>
          Archives
        </Link>

        {/* Insights */}
        <Link
          href="/insights"
          onClick={close}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
            isInsights ? 'bg-[#818CF8]/15 text-[#818CF8]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">insights</span>
          Insights
        </Link>

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

        {/* Start Session CTA */}
        <div className="pt-3">
          <Link
            href="/interview"
            onClick={close}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-[#818CF8] hover:bg-[#818CF8]/90 transition-all shadow-lg shadow-[#818CF8]/20"
          >
            <span className="material-symbols-outlined text-[20px]">mic</span>
            Start Session
          </Link>
        </div>

      </nav>

      {/* User + Sign out */}
      <div className="p-3 border-t border-white/5">
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
    </>
  )

  return (
    <>
      {/* ── Desktop Sidebar (md+) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#0A0A0A] h-full">
        <NavContent />
      </aside>

      {/* ── Mobile Hamburger Button (fixed, top-left) ─────────────────────── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed top-3 left-4 z-[60] w-9 h-9 flex items-center justify-center rounded-xl bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all shadow-lg"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-[22px]">menu</span>
      </button>

      {/* ── Mobile Slide-in Drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
              onClick={close}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-[80] w-72 flex flex-col bg-[#0A0A0A] border-r border-white/8 shadow-2xl"
            >
              <NavContent onClose={close} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
