'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, signInWithGoogle, onAuthStateChanged, getUserDoc, markOnboardingComplete } from '@/services/FirebaseService'
import OnboardingModal from '@/components/OnboardingModal'
import useAppStore from '@/store/useAppStore'

export default function LandingPage() {
  const router = useRouter()
  const setUser = useAppStore(s => s.setUser)
  const setOnboardingComplete = useAppStore(s => s.setOnboardingComplete)
  const [signingIn, setSigningIn] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        try {
          const userDoc = await getUserDoc(user.uid)
          if (userDoc && !userDoc.onboarding_complete) {
            setPendingUser(user)
            setShowOnboarding(true)
          } else {
            router.push('/interview')
          }
        } catch {
          router.push('/interview')
        }
      }
    })
    return () => unsub()
  }, [setUser, router])

  const handleSignIn = async () => {
    setSigningIn(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError('Sign in failed — please try again.')
      setSigningIn(false)
    }
  }

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false)
    if (pendingUser) {
      try { await markOnboardingComplete(pendingUser.uid) } catch {}
      setOnboardingComplete(true)
      router.push('/interview')
    }
  }

  return (
    <>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      {/* Background */}
      <div className="fixed inset-0 bg-[#0A0A0A] -z-10" />
      <div className="fixed inset-0 hero-gradient -z-10 pointer-events-none" />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#818CF8]/4 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#818CF8] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(129,140,248,0.4)]">
              <span className="material-symbols-outlined text-white text-lg sm:text-xl">psychology</span>
            </div>
            <span className="text-lg sm:text-xl font-display font-bold tracking-tight text-white">MindRoots</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="bg-white text-black text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-slate-100 transition-all shadow-lg shadow-white/10"
            >
              {signingIn ? 'Signing in...' : 'Get Started'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-44 pb-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20 text-[#818CF8] text-[10px] font-bold uppercase tracking-widest mb-8">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            AI-Driven Belief Archaeology
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
            What beliefs are<br />
            <span className="text-slate-400">silently running</span>{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#818CF8] to-[#a78bfa]">your life?</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A voice conversation with an AI Socratic detective that excavates the exact origin moments behind your limiting beliefs — and delivers a stunning visual map of your mind's history.
          </p>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-white/10 disabled:opacity-60"
            >
              {signingIn ? 'Opening...' : 'Begin Your Excavation'}
              <span className="material-symbols-outlined text-lg">arrow_outward</span>
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-colors">
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* Video Demo Window */}
      <section className="relative pb-24 max-w-5xl mx-auto px-4 sm:px-6 z-10">
        <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_-12px_rgba(129,140,248,0.25)]">
          {/* Mac window header */}
          <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          {/* Video content */}
          <div className="relative aspect-video w-full bg-black">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/jNQXAC9IVRw?rel=0" 
              title="MindRoots Demo" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            ></iframe>
          </div>
        </div>
      </section>

      {/* 3-Step How it works */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">How it works</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Three AI agents working in sequence to excavate, structure, and illustrate your inner world.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: 'mic', step: '01', title: 'Voice Interview', desc: 'A warm, persistent AI archaeologist asks "why" until it reaches the exact origin moment of each belief.' },
            { icon: 'account_tree', step: '02', title: 'Belief Structuring', desc: 'An AI data agent structures your raw beliefs into a validated Origin Tree with written analysis.' },
            { icon: 'auto_stories', step: '03', title: 'Your Map', desc: 'AI-generated illustrations, a narrated MP3 of your story, and a downloadable PDF of your Belief Origin Tree.' },
          ].map((item) => (
            <div key={item.step} className="glass-card p-8 rounded-2xl group hover:border-[#818CF8]/30 transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-[#818CF8]/15 rounded-xl flex items-center justify-center border border-[#818CF8]/20">
                  <span className="material-symbols-outlined text-[#818CF8]">{item.icon}</span>
                </div>
                <span className="text-4xl font-display font-black text-white/5">{item.step}</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-3">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sign-up CTA */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="glass-card rounded-3xl overflow-hidden grid lg:grid-cols-2">
          <div className="p-12 md:p-16 flex flex-col justify-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Ready to dig deeper?</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-md">
              Join thousands of founders, executives, and coaches who've excavated the foundations of their cognitive landscape.
            </p>
            <ul className="space-y-4">
              {['Personalized Socratic Voice Interview', 'AI-Generated Belief Origin Tree with illustrations', 'Downloadable PDF + Shareable Session Link'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="material-symbols-outlined text-[#818CF8] text-xl">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 md:p-12 bg-white/2 border-l border-white/5 flex items-center justify-center">
            <div className="glass-card p-8 rounded-3xl max-w-sm w-full">
              <h3 className="text-xl font-display font-bold text-white mb-6 text-center">Create your account</h3>
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-white/10 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>{signingIn ? 'Signing in...' : 'Continue with Google'}</span>
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-6 leading-relaxed">
                By signing up, you agree to our <a href="#" className="underline">Terms</a> and{' '}
                <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#818CF8]">psychology</span>
            <span className="text-xs text-slate-500">© 2026 MindRoots AI. All rights reserved.</span>
          </div>
          <div className="flex gap-8 text-[11px] font-semibold tracking-wide uppercase text-slate-500">
            <a href="#" className="hover:text-[#818CF8] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#818CF8] transition-colors">Security</a>
            <a href="#" className="hover:text-[#818CF8] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}
