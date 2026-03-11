import React from 'react';

export default function OnboardingStep1() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
            font-family: 'Inter', sans-serif;
        }
        .bg-mesh {
            background-color: #0a0a0a;
            background-image: 
                radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%);
        }
    ` }} />
      
<div className="relative flex h-screen w-full flex-col bg-mesh overflow-x-hidden">
<div className="layout-container flex h-full grow flex-col">
<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-white/10 px-6 py-4 md:px-20 lg:px-40">
<div className="flex items-center gap-3">
<div className="size-8 bg-indigo-accent rounded-lg flex items-center justify-center text-white">
<span className="material-symbols-outlined text-xl">psychology_alt</span>
</div>
<h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">MindRoots</h2>
</div>
<button className="flex items-center justify-center rounded-full h-10 w-10 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined text-slate-700 dark:text-slate-300">help</span>
</button>
</header>
<main className="flex-1 flex flex-col items-center justify-center px-6 md:px-20 lg:px-40 py-12">
<div className="max-w-[800px] w-full flex flex-col gap-12">
<div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden bg-card-dark border border-white/5 flex items-center justify-center group">
<div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&amp;fit=crop&amp;q=80&amp;w=1200')] bg-cover bg-center" data-alt="Minimalist abstract dark tree roots illustration"></div>
<div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
<div className="z-10 text-indigo-accent/80">
<span className="material-symbols-outlined text-8xl opacity-20">account_tree</span>
</div>
</div>
<div className="flex flex-col gap-6 text-center md:text-left">
<div className="space-y-2">
<span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase text-indigo-accent border border-indigo-accent/30 rounded-full">Introduction</span>
<h1 className="text-slate-900 dark:text-white text-5xl md:text-6xl font-black leading-tight tracking-tight">
                                What is MindRoots?
                            </h1>
</div>
<p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                            A private space to explore the origins of your convictions through deep voice interviews. Dig deep into the roots of your thinking.
                        </p>
</div>
<div className="flex flex-col gap-8 w-full">
<div className="w-full flex flex-col gap-3">
<div className="flex justify-between items-end">
<span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Step 1 of 3</span>
<span className="text-indigo-accent text-sm font-bold">33%</span>
</div>
<div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
<div className="h-full bg-indigo-accent w-1/3 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
</div>
</div>
<div className="flex items-center justify-between pt-4">
<button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                                Skip Intro
                            </button>
<button className="px-10 py-4 bg-indigo-accent hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 group">
                                Next
                                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
</button>
</div>
</div>
</div>
</main>
<footer className="px-6 md:px-20 lg:px-40 py-8 text-center md:text-left">
<p className="text-slate-500 dark:text-slate-600 text-xs">
                    © 2024 MindRoots. Private &amp; Encrypted.
                </p>
</footer>
</div>
</div>

    </>
  );
}
