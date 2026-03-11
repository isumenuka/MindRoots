import React from 'react';

export default function ProcessingStagesScreen() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
            background-color: #0A0A0A;
            color: #A3A3A3;
        }
        .ambient-gradient {
            background: radial-gradient(circle at 50% 50%, rgba(129, 140, 248, 0.08) 0%, rgba(10, 10, 10, 0) 70%);
        }
    ` }} />
      
{/*  Ambient Background Effect  */}
<div className="fixed inset-0 ambient-gradient pointer-events-none"></div>
<div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full"></div>
<div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full"></div>
<div className="relative z-10 flex flex-col min-h-screen">
{/*  Top Navigation  */}
<header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
<div className="flex items-center gap-3">
<div className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg">
<span className="material-symbols-outlined text-background-dark text-xl font-bold">auto_awesome</span>
</div>
<h1 className="font-display text-primary text-xl font-semibold tracking-tight">MindRoots</h1>
</div>
<div className="flex items-center gap-6">
<button className="text-muted hover:text-primary transition-colors">
<span className="material-symbols-outlined">close</span>
</button>
</div>
</header>
{/*  Main Content  */}
<main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
<div className="max-w-2xl w-full">
{/*  Header Section  */}
<div className="text-center mb-16">
<h2 className="font-display text-4xl md:text-5xl text-primary font-light mb-4 tracking-tight">
                        Excavating your <span className="italic">inner world</span>
</h2>
<p className="text-muted text-lg max-w-md mx-auto">
                        Our AI agents are weaving your belief archaeology. This may take a moment.
                    </p>
</div>
{/*  Processing Stages  */}
<div className="space-y-0 relative">
{/*  Vertical Line Connector  */}
<div className="absolute left-[19px] top-6 bottom-6 w-[1px] bg-white/10"></div>
{/*  Stage 1: Done  */}
<div className="relative flex gap-6 pb-10 group">
<div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 border border-accent/30 text-accent">
<span className="material-symbols-outlined text-xl">check</span>
</div>
<div className="flex flex-col">
<h3 className="text-primary font-medium text-lg leading-tight">Agent 1 complete</h3>
<p className="text-muted">Your beliefs have been excavated</p>
</div>
</div>
{/*  Stage 2: Done  */}
<div className="relative flex gap-6 pb-10 group">
<div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 border border-accent/30 text-accent">
<span className="material-symbols-outlined text-xl">check</span>
</div>
<div className="flex flex-col">
<h3 className="text-primary font-medium text-lg leading-tight">Agent 2 complete</h3>
<p className="text-muted">Structuring your belief map</p>
</div>
</div>
{/*  Stage 3: Active  */}
<div className="relative flex gap-6 pb-10 group">
<div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-primary border border-primary text-background-dark shadow-[0_0_20px_rgba(255,255,255,0.3)]">
<span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
</div>
<div className="flex flex-col">
<h3 className="text-primary font-semibold text-lg leading-tight">Agent 3 active</h3>
<p className="text-primary/80">Generating your illustrations...</p>
</div>
</div>
{/*  Stage 4: Pending  */}
<div className="relative flex gap-6 pb-10 group">
<div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-transparent border border-dim text-dim">
<span className="material-symbols-outlined text-xl">radio_button_unchecked</span>
</div>
<div className="flex flex-col">
<h3 className="text-dim font-medium text-lg leading-tight">Recording narration...</h3>
<p className="text-dim/60">Awaiting processing</p>
</div>
</div>
{/*  Stage 5: Pending  */}
<div className="relative flex gap-6 group">
<div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-transparent border border-dim text-dim">
<span className="material-symbols-outlined text-xl">radio_button_unchecked</span>
</div>
<div className="flex flex-col">
<h3 className="text-dim font-medium text-lg leading-tight">Drawing your Belief Origin Tree...</h3>
<p className="text-dim/60">Final sequence</p>
</div>
</div>
</div>
{/*  Footer Progress  */}
<div className="mt-20 pt-8 border-t border-white/5">
<div className="flex justify-between items-end mb-3">
<div className="flex flex-col">
<span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-1">Status</span>
<span className="text-primary font-medium">Synthesizing core patterns</span>
</div>
<span className="text-primary font-display text-2xl font-light">64%</span>
</div>
<div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-accent w-[64%] shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
</div>
</div>
</div>
</main>
{/*  Aesthetic Footer  */}
<footer className="p-8 text-center text-[10px] uppercase tracking-[0.4em] text-dim/40">
            System Identity: Roots-Core-V2 // Session: Archae-092-B
        </footer>
</div>
{/*  Background Decorative Elements  */}
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20">
<div className="absolute top-[20%] right-[15%] w-px h-32 bg-gradient-to-b from-transparent via-accent to-transparent"></div>
<div className="absolute bottom-[20%] left-[15%] w-px h-32 bg-gradient-to-b from-transparent via-accent to-transparent"></div>
</div>

    </>
  );
}
