'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, markOnboardingComplete, onAuthStateChanged, getUserDoc } from '@/services/FirebaseService'
import useAppStore from '@/store/useAppStore'
import { motion } from 'framer-motion'
import AppLogo from '@/components/AppLogo'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [user, setUser] = useState(null)
  const setOnboardingComplete = useAppStore(s => s.setOnboardingComplete)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/')
        return
      }
      setUser(u)
      const doc = await getUserDoc(u.uid)
      if (doc?.onboarding_complete) {
        router.push('/interview')
      }
    })
    return () => unsub()
  }, [router])

  const handleNext = () => setStep(s => Math.min(s + 1, 3))
  const handleBack = () => setStep(s => Math.max(s - 1, 1))

  const handleFinish = async () => {
    if (!user) return
    try {
      await markOnboardingComplete(user.uid)
      setOnboardingComplete(true)
      router.push('/interview')
    } catch (e) {
      console.error(e)
    }
  }

  if (step === 1) {
    return (
      <motion.div 
        initial={{ opacity: 0, filter: 'blur(10px)' }} 
        animate={{ opacity: 1, filter: 'blur(0px)' }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex h-screen w-full flex-col bg-[#0a0a0a] overflow-x-hidden"
      >
        {/* Mesh Background */}
        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(129, 140, 248, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(129, 140, 248, 0.05) 0px, transparent 50%)
          `
        }} />
        
        <div className="layout-container flex h-full grow flex-col relative z-10">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-white/5 py-4 px-6 md:px-20 lg:px-40">
            <AppLogo />
            <button className="flex items-center justify-center rounded-full h-10 w-10 bg-white/5 hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-slate-300">help</span>
            </button>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-20 lg:px-40 py-12">
            <div className="max-w-[800px] w-full flex flex-col gap-12">
              <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden bg-surface-dark border border-white/5 flex items-center justify-center group">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
                <div className="z-10 text-primary/80">
                  <span className="material-symbols-outlined text-8xl opacity-20">account_tree</span>
                </div>
              </div>

              <div className="flex flex-col gap-6 text-center md:text-left">
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase text-primary border border-primary/30 rounded-full">Introduction</span>
                  <h1 className="text-white text-4xl md:text-6xl font-display font-black leading-tight tracking-tight">
                    What is MindRoots?
                  </h1>
                </div>
                <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                  A private space to explore the origins of your convictions through deep voice interviews. Dig deep into the roots of your thinking.
                </p>
              </div>

              <div className="flex flex-col gap-8 w-full">
                <div className="w-full flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-400 text-sm font-medium">Step 1 of 3</span>
                    <span className="text-primary text-sm font-bold">33%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div layoutId="onboardingProgress" className="absolute left-0 top-0 h-full bg-primary rounded-full shadow-[0_0_15px_rgba(129,140,248,0.5)]" style={{ width: '33%' }}></motion.div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <button onClick={() => setStep(3)} className="text-slate-400 hover:text-white transition-colors font-medium">
                    Skip Intro
                  </button>
                  <button onClick={handleNext} className="px-10 py-4 bg-primary hover:scale-105 text-background-dark rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-white/10 group">
                    Next
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </main>
          
          <footer className="px-6 md:px-20 lg:px-40 py-8 text-center md:text-left">
            <p className="text-slate-600 text-xs">
              © 2026 MindRoots. Private & Encrypted.
            </p>
          </footer>
        </div>
      </motion.div>
    )
  }

  if (step === 2) {
    return (
      <motion.div 
        initial={{ opacity: 0, filter: 'blur(10px)' }} 
        animate={{ opacity: 1, filter: 'blur(0px)' }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex h-auto min-h-screen w-full flex-col bg-[#0a0a0a] overflow-x-hidden"
      >
        <div className="layout-container flex h-full grow flex-col relative z-10">
          <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 md:px-20 lg:px-40">
            <AppLogo />
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/settings')} className="flex w-10 h-10 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </header>

          <main className="flex flex-1 justify-center py-12 px-6 md:px-20 lg:px-40 relative z-10">
            <div className="flex flex-col max-w-2xl flex-1">
              <div className="flex flex-col gap-4 mb-12">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-1">Step 2 of 3</p>
                    <h1 className="text-white text-4xl font-display font-bold tracking-tight">How it works</h1>
                  </div>
                  <p className="text-slate-400 text-sm font-medium">66% Complete</p>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div layoutId="onboardingProgress" className="absolute left-0 top-0 h-full bg-primary rounded-full shadow-[0_0_15px_rgba(129,140,248,0.5)]" style={{ width: '66%' }}></motion.div>
                </div>
                <p className="text-slate-400 text-base">Our AI-driven process maps your core beliefs through a structured cognitive journey.</p>
              </div>

              <div className="flex flex-col gap-0 relative">
                <div className="absolute left-[23px] top-6 bottom-6 w-[1px] bg-white/10"></div>
                
                <div className="group relative grid grid-cols-[48px_1fr] gap-6 py-6 items-start">
                  <div className="z-10 flex w-12 h-12 items-center justify-center rounded-full bg-surface-dark border border-white/5">
                    <span className="material-symbols-outlined text-slate-400">mic</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-slate-300 font-display text-lg font-semibold">1. Voice Interview</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">An AI-guided session designed to capture the nuances of your natural thoughts and verbal expressions.</p>
                  </div>
                </div>

                <div className="group relative grid grid-cols-[48px_1fr] gap-6 py-6 items-start">
                  <div className="z-10 flex w-12 h-12 items-center justify-center rounded-full bg-primary shadow-[0_0_20px_rgba(129,140,248,0.3)]">
                    <span className="material-symbols-outlined text-background-dark">account_tree</span>
                  </div>
                  <div className="flex flex-col p-6 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-display text-lg font-bold">2. Belief Mapping</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-background-dark uppercase tracking-wider">Active</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-sm">Structural analysis of cognitive patterns, identifying the "roots" and connections of your primary belief system.</p>
                  </div>
                </div>

                <div className="group relative grid grid-cols-[48px_1fr] gap-6 py-6 items-start opacity-70">
                  <div className="z-10 flex w-12 h-12 items-center justify-center rounded-full bg-surface-dark border border-white/5">
                    <span className="material-symbols-outlined text-slate-400">visibility</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-slate-300 font-display text-lg font-semibold">3. Interactive Tree</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">A dynamic, navigable representation of your mind. Explore connections and insights visually.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-16 pt-8 border-t border-white/10">
                <button onClick={handleBack} className="px-6 py-3 text-slate-400 font-bold hover:text-white transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                </button>
                <button onClick={handleNext} className="px-10 py-3 bg-primary hover:scale-105 text-background-dark rounded-xl font-bold shadow-lg shadow-white/10 transition-all flex items-center gap-2">
                  Next Step <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </main>
          
          <div className="fixed top-1/4 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="fixed bottom-1/4 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        </div>
      </motion.div>
    )
  }

  // Step 3
  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)' }} 
      animate={{ opacity: 1, filter: 'blur(0px)' }} 
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative flex min-h-screen w-full flex-col bg-[#0a0a0a] overflow-x-hidden"
    >
      <div className="layout-container flex h-full grow flex-col relative z-10">
        <header className="flex items-center justify-between px-6 py-6 md:px-20 lg:px-40">
          <AppLogo />
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-white/20"></span>
            <span className="w-2 h-2 rounded-full bg-white/20"></span>
            <span className="w-8 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(129,140,248,0.5)]"></span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 md:px-20 lg:px-40">
          <div className="w-full max-w-[560px] flex flex-col items-center text-center">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
              <div className="relative flex items-center justify-center w-32 h-32 rounded-full border border-primary/30 bg-surface-dark/80 backdrop-blur-sm shadow-xl">
                <span className="material-symbols-outlined text-6xl text-primary font-light">shield_lock</span>
              </div>
            </div>

            <div className="space-y-4 mb-12">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-100 tracking-tight">Privacy First</h1>
              <p className="text-lg text-slate-400 font-light leading-relaxed max-w-md mx-auto">
                Your mind is your own. Your data is <span className="text-slate-100 font-medium">end-to-end encrypted</span> and never shared.
              </p>
            </div>

            <div className="w-full bg-surface-dark rounded-2xl border border-white/5 p-2 space-y-1">
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined leading-none">key</span>
                  </div>
                  <div className="text-left">
                    <p className="text-slate-100 font-medium text-sm">Zero-Knowledge Storage</p>
                    <p className="text-slate-500 text-xs mt-0.5">Only you hold the keys to your data</p>
                  </div>
                </div>
                <div className="w-11 h-6 bg-primary rounded-full relative">
                  <div className="absolute left-[22px] top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Biometric lock removed per user request */}

              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined leading-none">analytics</span>
                  </div>
                  <div className="text-left">
                    <p className="text-slate-100 font-medium text-sm">Anonymous Analytics</p>
                    <p className="text-slate-500 text-xs mt-0.5">Help us improve without sharing identity</p>
                  </div>
                </div>
                <div className="w-11 h-6 bg-primary rounded-full relative">
                  <div className="absolute left-[22px] top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="w-full mt-12 space-y-4">
              <button 
                onClick={handleFinish}
                className="w-full h-14 bg-primary hover:scale-[1.02] text-background-dark rounded-xl font-bold text-lg transition-transform flex items-center justify-center gap-2 shadow-lg shadow-white/10"
              >
                Finish Setup
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <p className="text-slate-500 text-xs px-8">
                By finishing setup, you agree to our <a className="text-primary hover:underline" href="#">Security Protocol</a> and <a className="text-primary hover:underline" href="#">Privacy Terms</a>.
              </p>
            </div>
            
            <button onClick={handleBack} className="mt-8 text-slate-500 hover:text-white text-sm font-medium transition-colors">
              Go Back
            </button>
          </div>
        </main>
        
        <div className="fixed bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="fixed top-1/4 -left-64 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-1/4 -right-64 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      </div>
    </motion.div>
  )
}
