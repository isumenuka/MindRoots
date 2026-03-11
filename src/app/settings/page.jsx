'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

  if (!user) return null;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-sans text-text-muted">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border-muted bg-background-light dark:bg-background-dark h-full">
        <div className="p-8 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-background-dark font-bold text-xl">psychology_alt</span>
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">MindRoots</h2>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/history" className="flex items-center gap-4 px-4 py-3 rounded-lg text-text-muted hover:bg-white/5 hover:text-slate-100 transition-all group">
            <span className="material-symbols-outlined text-[22px]">history</span>
            <span className="font-display font-medium">History</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-4 px-4 py-3 rounded-lg bg-primary/10 text-primary transition-all group">
            <span className="material-symbols-outlined text-[22px]">person</span>
            <span className="font-display font-medium">Profile</span>
          </Link>
          <a className="flex items-center gap-4 px-4 py-3 rounded-lg text-text-muted hover:bg-white/5 hover:text-slate-100 transition-all group" href="#">
            <span className="material-symbols-outlined text-[22px]">shield_lock</span>
            <span className="font-display font-medium">Privacy</span>
          </a>
          <a className="flex items-center gap-4 px-4 py-3 rounded-lg text-text-muted hover:bg-white/5 hover:text-slate-100 transition-all group" href="#">
            <span className="material-symbols-outlined text-[22px]">credit_card</span>
            <span className="font-display font-medium">Billing</span>
          </a>
        </nav>
        
        <div className="p-4 border-t border-border-muted">
          <button 
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-text-muted hover:text-danger transition-colors group"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="font-display font-medium">{signingOut ? 'Signing out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth relative">
        {/* Mobile Header elements (since sidebar is hidden) */}
        <header className="md:h-20 flex flex-col md:flex-row md:items-center justify-between p-6 md:px-12 border-b border-border-muted/50 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4 mb-4 md:mb-0 md:hidden">
            <Link href="/" className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-background-dark font-bold text-xl">psychology_alt</span>
            </Link>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-100">MindRoots</h2>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto">
             <div className="flex items-center gap-2 text-text-muted text-sm uppercase tracking-widest font-medium">
               <Link href="/history" className="hover:text-slate-200 transition-colors md:hidden">Menu</Link>
               <span className="material-symbols-outlined text-xs md:hidden">chevron_right</span>
               <span>Account</span>
               <span className="material-symbols-outlined text-xs">chevron_right</span>
               <span className="text-slate-100">Settings</span>
             </div>
             <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors border border-border-muted hidden md:flex">
               <span className="material-symbols-outlined text-slate-100">settings</span>
             </button>
             {/* Mobile bottom actions inside header just for quick access */}
             <button onClick={handleSignOut} className="md:hidden text-text-muted hover:text-slate-100">
               <span className="material-symbols-outlined">logout</span>
             </button>
          </div>
        </header>

        <div className="max-w-3xl mx-auto py-10 md:py-16 px-6 md:px-8 space-y-12">
          {/* Hero Section */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 border-b border-border-muted pb-12">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-background-dark flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img alt={user?.displayName || "Profile avatar"} className="w-full h-full object-cover opacity-80" src={user.photoURL} />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-text-muted">person</span>
                  )}
                </div>
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-background-dark shadow-xl hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">{user?.displayName || 'Believer'}</h1>
              <p className="text-text-muted text-lg font-light tracking-wide mt-1 italic">Archaeologist of the Mind</p>
            </div>
          </section>

          {/* Details Section */}
          <section className="grid gap-8">
            <div className="flex flex-col gap-2 group">
              <label className="font-display text-xs font-bold uppercase tracking-widest text-text-muted/60 ml-1">Email address</label>
              <div className="flex items-center justify-between px-5 py-4 bg-white/5 border border-border-muted rounded-xl">
                <span className="text-slate-200 truncate">{user?.email}</span>
                <span className="material-symbols-outlined text-primary cursor-pointer">verified</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-display text-xs font-bold uppercase tracking-widest text-text-muted/60 ml-1">Journey Started</label>
              <div className="px-5 py-4 bg-white/5 border border-border-muted rounded-xl text-slate-200">
                {userDoc?.created_at?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || '—'}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-6 border border-border-muted rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-accent mb-3">database</span>
                <h4 className="font-display text-slate-100 font-medium mb-1">Firestore Storage</h4>
                <p className="text-xs text-text-muted">Private user data</p>
              </div>
              <div className="p-6 border border-border-muted rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-accent mb-3">cloud_done</span>
                <h4 className="font-display text-slate-100 font-medium mb-1">Privacy Guard</h4>
                <p className="text-xs text-text-muted">No visual faces generated</p>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="mt-20 pt-12 border-t border-border-muted">
            <div className="flex items-center gap-2 mb-6 text-danger">
              <span className="material-symbols-outlined">warning</span>
              <h3 className="font-display text-lg font-bold tracking-tight">Danger Zone</h3>
            </div>
            
            {!deleteConfirm ? (
              <div className="p-6 sm:p-8 border border-danger/30 rounded-xl bg-danger/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <p className="text-slate-100 font-medium font-display">Account Deletion</p>
                  <p className="text-text-muted text-sm leading-relaxed mt-1">
                    Permanently delete your account, wiping all Firestore documents and GCS media. This action is irreversible.
                  </p>
                </div>
                <button 
                  onClick={() => setDeleteConfirm(true)}
                  className="whitespace-nowrap px-6 py-3 bg-danger text-slate-100 font-display font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-danger/20"
                >
                  Delete All My Data
                </button>
              </div>
            ) : (
              <div className="p-6 sm:p-8 border border-danger/50 rounded-xl bg-danger/10 flex flex-col gap-6">
                 <div>
                    <p className="text-danger font-medium font-display mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined">gpp_bad</span>
                        ⚠ This is permanent and cannot be undone.
                    </p>
                    <p className="text-text-muted text-sm leading-relaxed mt-1 border-l-2 border-danger/30 pl-3">
                        All your sessions, beliefs, audio narrations, and personal data will be immediately removed from our servers. You will be signed out.
                    </p>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-3">
                   <button 
                     onClick={() => setDeleteConfirm(false)} 
                     className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:text-white transition-colors flex-1"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleDeleteAll}
                     disabled={deleting}
                     className="px-6 py-3 rounded-xl bg-danger text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex-1 shadow-lg shadow-danger/20 flex items-center justify-center gap-2"
                   >
                     {deleting ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Deleting...
                        </>
                     ) : 'Yes, delete everything'}
                   </button>
                 </div>
              </div>
            )}
            
          </section>

          <footer className="pt-20 pb-12 flex justify-center opacity-30">
            <div className="flex items-center gap-2 grayscale brightness-200">
              <span className="material-symbols-outlined text-sm">psychology_alt</span>
              <span className="text-xs font-display font-bold uppercase tracking-[0.2em]">MindRoots Protocol v4.0.2</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
