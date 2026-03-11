import React from 'react';

export default function OnboardingStep2() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
            font-family: 'Inter', sans-serif;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24;
        }
    ` }} />
      
<div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
<div className="layout-container flex h-full grow flex-col">
{/*  Navigation Header  */}
<header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 py-4 md:px-20 lg:px-40">
<div className="flex items-center gap-3">
<div className="size-8 bg-accent flex items-center justify-center rounded-lg">
<span className="material-symbols-outlined text-white text-xl">psychology</span>
</div>
<h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">MindRoots</h2>
</div>
<div className="flex items-center gap-4">
<button className="flex size-10 items-center justify-center rounded-full bg-slate-200 dark:bg-surface-dark text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined">settings</span>
</button>
</div>
</header>
<main className="flex flex-1 justify-center py-12 px-6 md:px-20 lg:px-40">
<div className="layout-content-container flex flex-col max-w-2xl flex-1">
{/*  Progress Header  */}
<div className="flex flex-col gap-4 mb-12">
<div className="flex justify-between items-end">
<div>
<p className="text-accent text-sm font-semibold uppercase tracking-widest mb-1">Step 2 of 3</p>
<h1 className="text-slate-900 dark:text-white text-4xl font-extrabold tracking-tight">How it works</h1>
</div>
<p className="text-slate-500 dark:text-slate-400 text-sm font-medium">66% Complete</p>
</div>
<div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
<div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: '66%' }}></div>
</div>
<p className="text-slate-500 dark:text-slate-400 text-base">Our AI-driven process maps your core beliefs through a structured cognitive journey.</p>
</div>
{/*  Steps Visualization  */}
<div className="flex flex-col gap-0 relative">
{/*  Vertical Line Connector  */}
<div className="absolute left-[23px] top-6 bottom-6 w-[1px] bg-slate-200 dark:bg-white/10"></div>
{/*  Step 1: Voice Interview  */}
<div className="group relative grid grid-cols-[48px_1fr] gap-6 py-6 items-start">
<div className="z-10 flex size-12 items-center justify-center rounded-full bg-slate-200 dark:bg-surface-dark border border-slate-300 dark:border-white/5 transition-all">
<span className="material-symbols-outlined text-slate-500 dark:text-slate-400">mic</span>
</div>
<div className="flex flex-col">
<h3 className="text-slate-900 dark:text-slate-300 text-lg font-semibold">1. Voice Interview</h3>
<p className="text-slate-500 dark:text-slate-400 leading-relaxed">An AI-guided session designed to capture the nuances of your natural thoughts and verbal expressions.</p>
</div>
</div>
{/*  Step 2: Belief Mapping (Active)  */}
<div className="group relative grid grid-cols-[48px_1fr] gap-6 py-6 items-start">
<div className="z-10 flex size-12 items-center justify-center rounded-full bg-accent shadow-[0_0_20px_rgba(99,102,241,0.3)]">
<span className="material-symbols-outlined text-white">account_tree</span>
</div>
<div className="flex flex-col p-6 rounded-xl bg-accent/5 border border-accent/20">
<div className="flex items-center gap-2 mb-1">
<h3 className="text-slate-900 dark:text-white text-lg font-bold">2. Belief Mapping</h3>
<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent text-white uppercase tracking-wider">Active</span>
</div>
<p className="text-slate-600 dark:text-slate-300 leading-relaxed">Structural analysis of cognitive patterns, identifying the "roots" and connections of your primary belief system.</p>
</div>
</div>
{/*  Step 3: Visualization  */}
<div className="group relative grid grid-cols-[48px_1fr] gap-6 py-6 items-start opacity-50">
<div className="z-10 flex size-12 items-center justify-center rounded-full bg-slate-200 dark:bg-surface-dark border border-slate-300 dark:border-white/5">
<span className="material-symbols-outlined text-slate-500 dark:text-slate-400">visibility</span>
</div>
<div className="flex flex-col">
<h3 className="text-slate-900 dark:text-slate-300 text-lg font-semibold">3. Interactive Tree</h3>
<p className="text-slate-500 dark:text-slate-400 leading-relaxed">A dynamic, navigable representation of your mind. Explore connections and insights in 3D space.</p>
</div>
</div>
</div>
{/*  Footer Navigation  */}
<div className="flex items-center justify-between mt-16 pt-8 border-t border-slate-200 dark:border-white/10">
<button className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2">
<span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back
                    </button>
<button className="px-10 py-3 bg-accent hover:bg-accent/90 text-white rounded-full font-bold shadow-lg shadow-accent/20 transition-all flex items-center gap-2">
                        Next Step
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
</main>
{/*  Subtle Background Decorative Element  */}
<div className="fixed top-1/4 -right-24 size-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
<div className="fixed bottom-1/4 -left-24 size-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
</div>
</div>

    </>
  );
}
