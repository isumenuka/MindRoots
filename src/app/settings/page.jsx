'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, onAuthStateChanged, signOut, deleteAllUserData, getUserDoc } from '@/services/FirebaseService'
import useAppStore from '@/store/useAppStore'
import AppSidebar from '@/components/AppSidebar'

function SettingsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeSetUser = useAppStore(s => s.setUser)
  const [user, setUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Support ?tab=privacy deep-link from sidebar
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'privacy' || tab === 'profile') setActiveTab(tab)
  }, [searchParams])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/'); return }
      setUser(u)
      try { setUserDoc(await getUserDoc(u.uid)) } catch {}
    })
    return () => unsub()
  }, [router])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      storeSetUser(null)
      router.push('/')
    } catch (e) {
      console.error(e)
      setSigningOut(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!user) return
    setDeleting(true)
    try {
      await deleteAllUserData(user.uid)
      await signOut()
      storeSetUser(null)
      router.push('/')
    } catch (e) {
      console.error(e)
      setDeleting(false)
    }
  }

  if (!user) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0A] font-sans relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full" />
      </div>

      {/* Shared sidebar */}
      <AppSidebar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 lg:px-10 border-b border-white/5 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-slate-500">
            <span>Account</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-200 capitalize">{activeTab}</span>
          </div>
          {/* Mobile tab switcher */}
          <div className="flex md:hidden gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'profile' ? 'bg-[#818CF8]/20 text-[#818CF8]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'privacy' ? 'bg-[#818CF8]/20 text-[#818CF8]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Privacy
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto py-10 px-6 lg:px-8">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Avatar + Name */}
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#818CF8] to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
                      {user?.photoURL ? (
                        <img
                          alt={user?.displayName || 'Avatar'}
                          className="w-full h-full object-cover"
                          src={user.photoURL}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-slate-500">person</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                    {user?.displayName || 'Believer'}
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5 italic">Archaeologist of the Mind</p>
                </div>
              </div>

              {/* Info fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold text-slate-500 mb-2">Email</label>
                  <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                    <span className="text-slate-200 text-sm truncate">{user?.email}</span>
                    <span className="material-symbols-outlined text-[#818CF8] text-[18px]">verified</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold text-slate-500 mb-2">Member Since</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm">
                    {userDoc?.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || '—'}
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-8 border-t border-white/5">
                <div className="flex items-center gap-2 mb-5 text-red-400">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                  <h3 className="font-display text-base font-bold">Danger Zone</h3>
                </div>

                {!deleteConfirm ? (
                  <div className="p-6 border border-red-400/20 rounded-xl bg-red-400/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <p className="text-slate-100 font-semibold text-sm">Delete Account & All Data</p>
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                        Permanently removes all sessions, beliefs, and audio. This cannot be undone.
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="whitespace-nowrap px-5 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                    >
                      Delete All Data
                    </button>
                  </div>
                ) : (
                  <div className="p-6 border border-red-400/40 rounded-xl bg-red-400/[0.08] space-y-5">
                    <div>
                      <p className="text-red-400 font-semibold text-sm flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[18px]">gpp_bad</span>
                        This action is permanent and cannot be undone.
                      </p>
                      <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-red-400/30 pl-3">
                        All your sessions, beliefs, audio narrations, and personal data will be immediately removed. You will be signed out.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="flex-1 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAll}
                        disabled={deleting}
                        className="flex-1 px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                      >
                        {deleting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Deleting…
                          </>
                        ) : 'Yes, delete everything'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PRIVACY TAB ── */}
          {activeTab === 'privacy' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="border-b border-white/5 pb-6">
                <h1 className="font-display text-3xl font-bold text-white tracking-tight">Privacy & Security</h1>
                <p className="text-slate-500 mt-2">Manage your data, anonymity, and security preferences.</p>
              </div>

              <div className="space-y-4">
                {/* Data Export */}
                <div className="p-6 border border-white/10 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-display text-slate-100 font-semibold mb-1">Export Your Data</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">Download a copy of all your sessions, belief maps, and insights as a ZIP archive.</p>
                    </div>
                    <button className="shrink-0 px-4 py-2 bg-white/10 text-slate-100 font-semibold text-sm rounded-lg hover:bg-white/20 transition-colors border border-white/10">
                      Request
                    </button>
                  </div>
                </div>

                {/* Session Anonymity */}
                <div className="p-6 border border-white/10 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-display text-slate-100 font-semibold mb-1">AI Training Opt-Out</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">Your sessions are never used to train AI models. This is always enabled.</p>
                    </div>
                    <div className="shrink-0 w-11 h-6 bg-[#818CF8]/30 rounded-full relative border border-[#818CF8]/50 flex items-center">
                      <div className="w-4 h-4 bg-[#818CF8] rounded-full absolute right-1 shadow" />
                    </div>
                  </div>
                </div>

                {/* Zero-knowledge */}
                <div className="p-6 border border-white/10 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-[#818CF8] text-[20px]">lock</span>
                    <h4 className="font-display text-slate-100 font-semibold">End-to-End Encrypted Storage</h4>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">All session data is stored with zero-knowledge encryption. Not even MindRoots can read your raw transcripts.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  )
}
