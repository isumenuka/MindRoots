import React from 'react';

export default function BeliefOriginTreeResults() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
            font-family: 'Inter', sans-serif;
            background-color: #0A0A0A;
        }
        .font-outfit { font-family: 'Outfit', sans-serif; }
    ` }} />
      
<div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
<div className="layout-container flex h-full grow flex-col">
{/*  Top Navigation  */}
<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 py-4 lg:px-40">
<div className="flex items-center gap-3">
<div className="size-6 text-accent">
<svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fillRule="evenodd"  /></path>
</svg>
</div>
<h2 className="text-slate-100 text-xl font-outfit font-bold tracking-tight">MindRoots</h2>
</div>
<div className="flex gap-3">
<button className="flex items-center justify-center rounded-xl h-10 w-10 bg-surface text-slate-100 hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined text-[20px]">notifications</span>
</button>
<div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
<span className="material-symbols-outlined text-accent">person</span>
</div>
</div>
</header>
<main className="flex flex-1 flex-col items-center">
<div className="w-full max-w-[960px] px-6 lg:px-10 py-8">
{/*  Hero Section  */}
<div className="mb-10 text-center lg:text-left">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-4">
<span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
<span className="text-xs font-medium text-accent uppercase tracking-wider">Analysis Complete</span>
</div>
<h1 className="text-4xl lg:text-5xl font-outfit font-bold text-slate-100 mb-3 tracking-tight">The Burden of Performance</h1>
<p className="text-slate-400 font-body text-base lg:text-lg">
                            Oct 24, 2026 <span className="mx-2 opacity-30">•</span> 4 Core Beliefs Identified
                        </p>
</div>
{/*  Sticky Action Bar (Simulated Sticky)  */}
<div className="sticky top-4 z-50 mb-12">
<div className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
{/*  Minimal MP3 Player  */}
<div className="flex items-center gap-4 flex-1 min-w-[280px]">
<button className="flex items-center justify-center rounded-full size-10 bg-primary text-background-dark hover:scale-105 transition-transform">
<span className="material-symbols-outlined fill-1">play_arrow</span>
</button>
<div className="flex-1">
<div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
<span>Session Audio</span>
<span>03:45</span>
</div>
<div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
<div className="h-full bg-accent w-1/3 rounded-full"></div>
</div>
</div>
</div>
{/*  Action Buttons  */}
<div className="flex gap-2">
<button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-white/10 text-sm font-bold text-slate-100 hover:bg-white/5 transition-colors">
<span className="material-symbols-outlined text-[18px]">download</span>
<span>PDF</span>
</button>
<button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-white/10 text-sm font-bold text-slate-100 hover:bg-white/5 transition-colors">
<span className="material-symbols-outlined text-[18px]">share</span>
<span>Share</span>
</button>
</div>
</div>
</div>
{/*  Belief Origin Tree / Vertical Stack  */}
<div className="space-y-8 relative">
{/*  Connecting Line  */}
<div className="absolute left-0 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent/50 via-accent/10 to-transparent hidden lg:block -translate-x-1/2"></div>
{/*  Belief Card 1  */}
<div className="relative flex flex-col lg:flex-row gap-6 bg-card border border-white/5 rounded-xl overflow-hidden group hover:border-accent/30 transition-all duration-500">
{/*  Left: Moody Illustration  */}
<div className="lg:w-1/3 h-48 lg:h-auto relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-r from-background-dark/80 to-transparent z-10"></div>
<div className="w-full h-full bg-slate-900 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" data-alt="Abstract moody pile of heavy dark stones in dim light" style={{ backgroundImage: 'url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuBjxUsITZJ5BCGD2fPzoinLCrjVUe5MrRqXJESR6oJaXbTt8X5n_U7xYGDy0W22Cc60K9pjw_0EBIwzPIRJcXEQrk7131L4etDX1SKi6G0eHG66xo-Ljl31_Iwf2MJ6l0WeVbRCqrFByK18wi6fcuOcb-IDwtAyvoce5YnpryFZho2SoqAOhDEb43lCVCXjp4NB-vkWGxbcc-us5AuJqBCa6Og9c55eqnUjq3bPswHcazusEy-KkftafUiNatFBrpxh0qUFuV6jnhA\')' }}>
</div>
<div className="absolute bottom-4 left-4 z-20">
<span className="text-[40px] font-outfit font-black text-white/10">01</span>
</div>
</div>
{/*  Right: Content  */}
<div className="lg:w-2/3 p-6 lg:p-8 flex flex-col justify-center">
{/*  Timeline  */}
<div className="flex items-center gap-3 mb-4">
<div className="h-px w-8 bg-accent/40"></div>
<div className="flex items-center gap-2">
<div className="size-2 rounded-full bg-accent shadow-[0_0_8px_rgba(129,138,248,0.8)]"></div>
<span className="text-xs font-bold text-accent uppercase tracking-widest">Origin: 1998 (Age 11)</span>
</div>
</div>
{/*  Headline  */}
<h3 className="text-2xl font-outfit font-semibold text-slate-100 mb-4 leading-tight">
                                    "I am only as valuable as my last achievement."
                                </h3>
{/*  Analysis  */}
<p className="text-slate-400 font-body leading-relaxed mb-6">
                                    You internalized this during middle school when praise was exclusively tied to academic success, creating a framework where resting feels like failure.
                                </p>
{/*  Cost Box  */}
<div className="bg-surface rounded-lg p-4 border-l-2 border-accent/50">
<p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Cost Today</p>
<p className="text-slate-300 text-sm italic">
                                        Chronic burnout and inability to enjoy unstructured time.
                                    </p>
</div>
</div>
</div>
{/*  Belief Card 2  */}
<div className="relative flex flex-col lg:flex-row gap-6 bg-card border border-white/5 rounded-xl overflow-hidden group hover:border-accent/30 transition-all duration-500">
<div className="lg:w-1/3 h-48 lg:h-auto relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-r from-background-dark/80 to-transparent z-10"></div>
<div className="w-full h-full bg-slate-900 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" data-alt="Cracked dry earth with deep shadows" style={{ backgroundImage: 'url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuBktWXBfDbMIwQJZ8sWywweug2L1N8aQ6m-RaB0IywvI0K7Flj624klDfyD9eAcGqOWzHPXWOyRdaROIHYrm30jtR6gn5lWH39rDqM8HkKcvppjiqv8_m1cyE6FKB0x2Fptm1tOpkLQR8zEE-VOibCZNIFSJKwtra6S19qo2xcnNNtasdjdEEIjfCjl-nCeJzfx2cF2a5wwpqVR0qjnTyONfcRxmgL4ra4byI7lIInHCH91uVzavqLWZMHREljLMMGp23yfhhWJLuE\')' }}>
</div>
<div className="absolute bottom-4 left-4 z-20">
<span className="text-[40px] font-outfit font-black text-white/10">02</span>
</div>
</div>
<div className="lg:w-2/3 p-6 lg:p-8 flex flex-col justify-center">
<div className="flex items-center gap-3 mb-4">
<div className="h-px w-8 bg-accent/40"></div>
<div className="flex items-center gap-2">
<div className="size-2 rounded-full bg-accent"></div>
<span className="text-xs font-bold text-accent uppercase tracking-widest">Origin: 2005 (Age 18)</span>
</div>
</div>
<h3 className="text-2xl font-outfit font-semibold text-slate-100 mb-4 leading-tight">
                                    "Vulnerability is a lack of control."
                                </h3>
<p className="text-slate-400 font-body leading-relaxed mb-6">
                                    Rooted in the transition to adulthood where self-reliance was forced early. You viewed asking for help as a crack in your armor.
                                </p>
<div className="bg-surface rounded-lg p-4 border-l-2 border-accent/50">
<p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Cost Today</p>
<p className="text-slate-300 text-sm italic">
                                        Emotional isolation and difficulty forming deep, reciprocal bonds.
                                    </p>
</div>
</div>
</div>
{/*  Belief Card 3  */}
<div className="relative flex flex-col lg:flex-row gap-6 bg-card border border-white/5 rounded-xl overflow-hidden group hover:border-accent/30 transition-all duration-500">
<div className="lg:w-1/3 h-48 lg:h-auto relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-r from-background-dark/80 to-transparent z-10"></div>
<div className="w-full h-full bg-slate-900 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" data-alt="Deep dark forest with a single beam of light" style={{ backgroundImage: 'url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuB-98G4dRbF0EEi5IMHzONnxAJ370HPhPc_pa-r-uDGvJuFBX9GQdiy-an5uyiUXCSouxNyVSxfyLcfTLcP5P02LexIoAP8jzMJ_SbDxiWcsjfZXWobl6bmbPiFVm9V6Qww63rKEK4cy4bRoG9DDWnIqHrLyfJUghM8P6SS0DcP08xd59MuYIxeA7qeUbplbzfuT9sVQ3raIZyrot9LFYzZRKM5vBU9IYxZ1jd9t99YtlBlkLgEyFGSU9LQhS7czxaVevV7K7AYMvg\')' }}>
</div>
<div className="absolute bottom-4 left-4 z-20">
<span className="text-[40px] font-outfit font-black text-white/10">03</span>
</div>
</div>
<div className="lg:w-2/3 p-6 lg:p-8 flex flex-col justify-center">
<div className="flex items-center gap-3 mb-4">
<div className="h-px w-8 bg-accent/40"></div>
<div className="flex items-center gap-2">
<div className="size-2 rounded-full bg-accent"></div>
<span className="text-xs font-bold text-accent uppercase tracking-widest">Origin: 2012 (Age 25)</span>
</div>
</div>
<h3 className="text-2xl font-outfit font-semibold text-slate-100 mb-4 leading-tight">
                                    "Safety requires constant hyper-vigilance."
                                </h3>
<p className="text-slate-400 font-body leading-relaxed mb-6">
                                    Developed during high-stress career shifts where mistakes had visible consequences, teaching your nervous system to never fully power down.
                                </p>
<div className="bg-surface rounded-lg p-4 border-l-2 border-accent/50">
<p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Cost Today</p>
<p className="text-slate-300 text-sm italic">
                                        Generalized anxiety and physical tension in the neck and shoulders.
                                    </p>
</div>
</div>
</div>
</div>
{/*  Footer / Reflection Prompt  */}
<div className="mt-16 text-center">
<div className="max-w-xl mx-auto space-y-6">
<div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
<p className="text-slate-500 font-body text-sm italic">
                                "The first step to uprooting a belief is to see where it was planted."
                            </p>
<button className="px-8 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/80 transition-all shadow-lg shadow-accent/20">
                                Begin Uprooting Exercise
                            </button>
</div>
</div>
</div>
</main>
{/*  Bottom Spacer  */}
<footer className="p-10 border-t border-white/5 text-center text-slate-600 text-xs">
                © 2026 MindRoots Introspective Systems. All rights reserved.
            </footer>
</div>
</div>

    </>
  );
}
