'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, onAuthStateChanged, signOut, deleteAllUserData, getUserDoc } from '@/services/FirebaseService'
import useAppStore from '@/store/useAppStore'

export default function SettingsPage() {
  const router = useRouter()
  const storeSetUser = useAppStore(s => s.setUser)
  const [user, setUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[40%] h-[30%] bg-[#818CF8]/4 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-5 lg:px-16">
        <button onClick={() => router.back()} className="flex items-center gap-2 sm:gap-3 group">
          <span className="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors text-[20px] sm:text-[24px]">arrow_back</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#818CF8] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[16px] sm:text-[18px]">psychology</span>
            </div>
            <h1 className="font-display text-base sm:text-lg font-bold text-white">MindRoots</h1>
          </div>
        </button>
        <h2 className="font-display text-base sm:text-lg font-semibold text-slate-400">Settings</h2>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Account Info */}
        <section className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Account</h3>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 flex items-center gap-4 border-b border-white/5">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full border border-white/20" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#818CF8]/20 border border-[#818CF8]/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#818CF8]">person</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{user?.displayName || 'User'}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              <div>
                <p className="text-sm font-medium text-slate-300">Member since</p>
                <p className="text-xs text-slate-600">
                  {userDoc?.created_at?.toDate?.()?.toLocaleDateString() || '—'}
                </p>
              </div>
              <div className="hidden sm:block w-px h-8 bg-white/5" />
              <div className="sm:text-right">
                <p className="text-sm font-medium text-slate-300">Data storage</p>
                <p className="text-xs text-slate-600">Firebase / GCS — your account only</p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Privacy</h3>
          <div className="glass-card rounded-2xl overflow-hidden">
            {[
              { icon: 'shield_person', title: 'Your data stays private', desc: 'No other users can access your beliefs or sessions.' },
              { icon: 'link_off', title: 'Links expire', desc: 'Shared session links can be revoked at any time.' },
              { icon: 'no_photography', title: 'Person generation disabled', desc: 'All AI illustrations are generated without any human faces.' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-4 p-5 ${i < 2 ? 'border-b border-white/5' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-[#818CF8]/15 border border-[#818CF8]/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#818CF8] text-lg">{item.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Actions</h3>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/8 transition-all text-left group"
          >
            <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">logout</span>
            <div>
              <p className="text-sm font-semibold text-white">{signingOut ? 'Signing out...' : 'Sign out'}</p>
              <p className="text-xs text-slate-500">You can sign back in with Google at any time.</p>
            </div>
          </button>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all text-left group"
            >
              <span className="material-symbols-outlined text-red-400">delete_forever</span>
              <div>
                <p className="text-sm font-semibold text-red-400">Delete all my data</p>
                <p className="text-xs text-slate-500">Permanently removes all sessions, beliefs, and media.</p>
              </div>
            </button>
          ) : (
            <div className="p-5 rounded-xl border border-red-500/30 bg-red-500/10">
              <p className="text-sm text-red-300 font-semibold mb-2">⚠ This is permanent and cannot be undone.</p>
              <p className="text-xs text-slate-500 mb-4">All Firestore docs and storage files will be deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete everything'}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
