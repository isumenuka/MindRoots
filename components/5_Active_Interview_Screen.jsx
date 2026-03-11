import React from 'react';

export default function ActiveInterviewScreen() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
            font-family: 'Inter', sans-serif;
        }
        .heading-font {
            font-family: 'Outfit', sans-serif;
        }
        .frosted-glass {
            background: rgba(25, 25, 25, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .waveform-bar {
            width: 4px;
            background-color: #818CF8;
            border-radius: 2px;
            transition: height 0.3s ease;
        }
    ` }} />
      
<header className="flex items-center justify-between px-6 py-6 lg:px-12 border-b border-white/5">
<div className="flex items-center gap-3">
<div className="flex items-center justify-center size-10 rounded-xl bg-white/5">
<span className="material-symbols-outlined text-accent">psychology</span>
</div>
<div>
<h1 className="heading-font text-xl font-bold tracking-tight text-white">MindRoots</h1>
</div>
</div>
<div className="flex items-center gap-6">
<div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
<span className="text-sm font-medium text-slate-300">🔥 3 core beliefs excavated</span>
</div>
<button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-semibold text-white/70 hover:text-white">
<span className="material-symbols-outlined text-[20px]">call_end</span>
                End Session
            </button>
</div>
</header>
<main className="flex-1 flex flex-col items-center justify-center px-6 relative">
<div className="absolute inset-0 overflow-hidden pointer-events-none">
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]"></div>
</div>
<div className="flex flex-col items-center gap-8 z-10">
<div className="flex items-end justify-center gap-1.5 h-48 w-full max-w-2xl">
<div className="waveform-bar h-12"></div>
<div className="waveform-bar h-24"></div>
<div className="waveform-bar h-32"></div>
<div className="waveform-bar h-44"></div>
<div className="waveform-bar h-28"></div>
<div className="waveform-bar h-40"></div>
<div className="waveform-bar h-52"></div>
<div className="waveform-bar h-36"></div>
<div className="waveform-bar h-48"></div>
<div className="waveform-bar h-32"></div>
<div className="waveform-bar h-24"></div>
<div className="waveform-bar h-44"></div>
<div className="waveform-bar h-20"></div>
<div className="waveform-bar h-32"></div>
<div className="waveform-bar h-48"></div>
<div className="waveform-bar h-52"></div>
<div className="waveform-bar h-40"></div>
<div className="waveform-bar h-28"></div>
<div className="waveform-bar h-36"></div>
<div className="waveform-bar h-24"></div>
<div className="waveform-bar h-12"></div>
</div>
<div className="text-center">
<p className="heading-font text-2xl md:text-3xl font-medium text-white max-w-2xl leading-relaxed">
                    Listening to your journey...
                </p>
<p className="text-slate-400 mt-2">MindRoots is analyzing the patterns in your narrative.</p>
</div>
</div>
</main>
<section className="p-6 lg:p-8 max-w-5xl mx-auto w-full mb-8">
<div className="frosted-glass rounded-xl p-6 lg:p-8 max-h-[300px] overflow-y-auto flex flex-col gap-8 custom-scrollbar">
<div className="flex gap-4 max-w-3xl">
<div className="flex-shrink-0 size-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
<span className="material-symbols-outlined text-accent text-[20px]">smart_toy</span>
</div>
<div className="flex flex-col gap-2">
<span className="text-[11px] uppercase tracking-widest font-bold text-accent">Agent</span>
<p className="text-[17px] leading-relaxed text-slate-200">
                        That's interesting. When you say you 'always have to earn your rest,' where do you think that rule came from?
                    </p>
</div>
</div>
<div className="flex gap-4 max-w-3xl ml-auto flex-row-reverse">
<div className="flex-shrink-0 size-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 overflow-hidden">
<div className="w-full h-full bg-cover bg-center" data-alt="Portrait of a young person reflecting" style={{ backgroundImage: 'url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuBZDV_LiY0PEYQbH-ukG--dqEWP-ojLMKJ6OeVhxCDmxbRAgWqQwtIIGTrf7rl96md13iANilKjb9DNaHqOKjSqn9_hDuNT3Sn67EQ9AGoErx2m0z6_Shu2YGvuTdEdcR9O48SMK0kQ2x9tCad-VjvGEYXBeYFKWlUo2hhqAZINahh6sa0lYAc7MS9cEKOuQfnS3c1Kwnsfk2qNRteP449-sN406a7E8A9FM0pbnGprvkys9dTmQqebOXzsoBMS-JIuLDWHcT1u2hw\')' }}></div>
</div>
<div className="flex flex-col gap-2 items-end">
<span className="text-[11px] uppercase tracking-widest font-bold text-slate-500">You</span>
<p className="text-[17px] leading-relaxed text-white text-right">
                        I guess... I saw my father working every weekend when I was a kid.
                    </p>
</div>
</div>
<div className="flex gap-4 max-w-3xl">
<div className="flex-shrink-0 size-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
<span className="material-symbols-outlined text-accent text-[20px]">smart_toy</span>
</div>
<div className="flex flex-col gap-2">
<span className="text-[11px] uppercase tracking-widest font-bold text-accent">Agent</span>
<div className="flex gap-1.5 items-center mt-1">
<div className="size-1.5 rounded-full bg-accent/60 animate-pulse"></div>
<div className="size-1.5 rounded-full bg-accent/60 animate-pulse delay-75"></div>
<div className="size-1.5 rounded-full bg-accent/60 animate-pulse delay-150"></div>
</div>
</div>
</div>
</div>
</section>
<footer className="flex items-center justify-center pb-8 px-6">
<div className="flex gap-4">
<button className="size-14 rounded-full bg-white text-background-dark flex items-center justify-center hover:scale-105 transition-transform">
<span className="material-symbols-outlined font-bold">mic</span>
</button>
<button className="size-14 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined">pause</span>
</button>
<button className="size-14 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined">edit</span>
</button>
</div>
</footer>

    </>
  );
}
