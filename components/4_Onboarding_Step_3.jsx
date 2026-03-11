import React from 'react';

export default function OnboardingStep3() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
            font-variation-settings: 'WHT' 300, 'OPSZ' 24;
        }
        body {
            font-family: 'Inter', sans-serif;
        }
        h1, h2, h3 {
            font-family: 'Outfit', sans-serif;
        }
    ` }} />
      
<div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
<div className="layout-container flex h-full grow flex-col">
{/*  Navigation Header  */}
<header className="flex items-center justify-between px-6 py-6 md:px-20 lg:px-40">
<div className="flex items-center gap-2">
<div className="text-primary">
<span className="material-symbols-outlined text-3xl">psychology</span>
</div>
<h2 className="text-slate-100 text-xl font-bold tracking-tight">MindRoots</h2>
</div>
<div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
<span className="w-2 h-2 rounded-full bg-slate-700"></span>
<span className="w-2 h-2 rounded-full bg-slate-700"></span>
<span className="w-8 h-2 rounded-full bg-primary"></span>
</div>
</header>
<main className="flex flex-1 flex-col items-center justify-center px-6 py-10 md:px-20 lg:px-40">
<div className="w-full max-w-[560px] flex flex-col items-center text-center">
{/*  Shield Icon Section  */}
<div className="relative mb-12">
<div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full"></div>
<div className="relative flex items-center justify-center w-32 h-32 rounded-full border border-primary/20 bg-surface-dark/50 backdrop-blur-sm">
<span className="material-symbols-outlined text-6xl text-primary font-light" style={{ fontVariationSettings: '\'WGHT\' 200' }}>shield_lock</span>
</div>
</div>
{/*  Hero Text  */}
<div className="space-y-4 mb-12">
<h1 className="text-4xl md:text-5xl font-bold text-slate-100 tracking-tight">Privacy First</h1>
<p className="text-lg text-slate-400 font-light leading-relaxed max-w-md mx-auto">
                            Your mind is your own. Your data is <span className="text-slate-100 font-medium">end-to-end encrypted</span> and never shared.
                        </p>
</div>
{/*  Security Preferences  */}
<div className="w-full bg-surface-dark rounded-2xl border border-border-dark p-2 space-y-1">
{/*  Preference Row 1  */}
<div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/50 transition-colors">
<div className="flex items-center gap-4">
<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
<span className="material-symbols-outlined">key</span>
</div>
<div className="text-left">
<p className="text-slate-100 font-medium">Zero-Knowledge Storage</p>
<p className="text-slate-500 text-xs">Only you hold the keys to your data</p>
</div>
</div>
<label className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-primary transition-colors">
<input checked="" className="sr-only peer" type="checkbox" />
<div className="absolute left-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:left-6"></div>
</label>
</div>
{/*  Preference Row 2  */}
<div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/50 transition-colors">
<div className="flex items-center gap-4">
<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
<span className="material-symbols-outlined">fingerprint</span>
</div>
<div className="text-left">
<p className="text-slate-100 font-medium">Biometric Lock</p>
<p className="text-slate-500 text-xs">Require authentication to open app</p>
</div>
</div>
<label className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-slate-700 transition-colors has-[:checked]:bg-primary">
<input className="sr-only peer" type="checkbox" />
<div className="absolute left-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:left-6"></div>
</label>
</div>
{/*  Preference Row 3  */}
<div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/50 transition-colors">
<div className="flex items-center gap-4">
<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
<span className="material-symbols-outlined">analytics</span>
</div>
<div className="text-left">
<p className="text-slate-100 font-medium">Anonymous Analytics</p>
<p className="text-slate-500 text-xs">Help us improve without sharing identity</p>
</div>
</div>
<label className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-primary transition-colors">
<input checked="" className="sr-only peer" type="checkbox" />
<div className="absolute left-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:left-6"></div>
</label>
</div>
</div>
{/*  Footer Action  */}
<div className="w-full mt-12 space-y-4">
<button className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                            Finish Setup
                            <span className="material-symbols-outlined">arrow_forward</span>
</button>
<p className="text-slate-500 text-xs px-8">
                            By finishing setup, you agree to our <a className="text-primary hover:underline" href="#">Security Protocol</a> and <a className="text-primary hover:underline" href="#">Privacy Terms</a>.
                        </p>
</div>
</div>
</main>
{/*  Decorative Elements  */}
<div className="fixed bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
<div className="fixed top-1/4 -left-64 w-96 h-96 bg-primary/5 blur-[120px] rounded-full"></div>
<div className="fixed bottom-1/4 -right-64 w-96 h-96 bg-primary/5 blur-[120px] rounded-full"></div>
</div>
</div>

    </>
  );
}
