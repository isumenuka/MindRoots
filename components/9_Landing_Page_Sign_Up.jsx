import React from 'react';

export default function LandingPageSignUp() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .hero-gradient {
            background: radial-gradient(circle at center, rgba(129, 140, 248, 0.15) 0%, transparent 70%);
        }
        .google-btn-shadow {
            box-shadow: 0 0 20px rgba(129, 140, 248, 0.2);
        }
        body {
            font-family: 'Inter', sans-serif;
        }
        h1, h2, h3, .font-display {
            font-family: 'Outfit', sans-serif;
        }
    ` }} />
      
<nav className="fixed top-0 w-full z-50 border-b border-slate-200/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
<div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
<span className="material-symbols-rounded text-white text-xl">psychology</span>
</div>
<span className="text-xl font-display font-bold tracking-tight dark:text-white">MindRoots</span>
</div>
<div className="hidden md:flex items-center gap-8 text-sm font-medium">
<a className="hover:text-primary transition-colors" href="#">Platform</a>
<a className="hover:text-primary transition-colors" href="#">Methodology</a>
<a className="hover:text-primary transition-colors" href="#">Pricing</a>
</div>
<div className="flex items-center gap-4">
<button className="text-sm font-medium px-4 py-2 hover:text-primary transition-colors">Login</button>
<button className="bg-white dark:bg-white text-black text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-slate-100 transition-all">Sign Up</button>
</div>
</div>
</nav>
<section className="relative pt-40 pb-20 overflow-hidden">
<div className="absolute inset-0 hero-gradient -z-10"></div>
<div className="max-w-5xl mx-auto px-6 text-center">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-8">
<span className="material-symbols-rounded text-sm">auto_awesome</span>
                AI-Driven Cognitive Archaeology
            </div>
<h1 className="text-5xl md:text-7xl font-display font-bold dark:text-white mb-6 leading-tight">
                Unearth the roots of <br /><span className="text-slate-400">your</span> <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">beliefs.</span>
</h1>
<p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                An AI-powered archaeology platform for the mind. Navigate the complex architecture of your subconscious with surgical precision.
            </p>
<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
<button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                    Start Your Journey
                    <span className="material-symbols-rounded text-lg">arrow_outward</span>
</button>
<button className="w-full sm:w-auto px-8 py-4 bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 dark:text-white font-medium rounded-xl hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors">
                    View Demo
                </button>
</div>
</div>
<div className="max-w-6xl mx-auto px-6 mt-20">
<div className="relative rounded-2xl overflow-hidden border border-slate-200/20 dark:border-white/10 bg-slate-900 shadow-2xl group">
<div className="h-10 bg-slate-800/50 dark:bg-white/5 flex items-center px-4 gap-2 border-b border-white/5">
<div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
<div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
<div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
</div>
<div className="relative aspect-video cursor-pointer">
<img alt="MindRoots Platform Visualization" className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXJD4IOdJYe8uV2JZhllYx0HlJQPUCkBcl4Lr3KdqdEeWBiTlKDpfu2pA1YOKsszKUz1A0xRUAyrYNir3FvCTQG09hKLImikOhH9F9SWdmuBBxH9ZuX1iqiKilynmNhg6ymvUK8YPu6O6epEqPCqb8GMvYjRqrLQFoXW3sFU37QdM4rtJ_sNk9S_l4shrSOqNrHF9DZue_JLF_DPQu8RQLnAd8TXkXTw1TS25ltn9OIo1QXg2ZYGiObcnMKCd9M1GyUyMxmW4V5n0" />
<div className="absolute inset-0 flex items-center justify-center">
<div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
<span className="material-symbols-rounded text-white text-4xl translate-x-0.5">play_arrow</span>
</div>
</div>
</div>
</div>
</div>
</section>
<section className="py-24 max-w-7xl mx-auto px-6">
<div className="grid md:grid-cols-3 gap-6">
<div className="glass-card p-8 rounded-2xl">
<div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
<span className="material-symbols-rounded text-primary">psychology_alt</span>
</div>
<h3 className="text-xl font-display font-bold dark:text-white mb-3">AI-Powered Insight</h3>
<p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Discover hidden patterns in your daily thoughts and reactions with our proprietary Sparkfire technology.
                </p>
</div>
<div className="glass-card p-8 rounded-2xl">
<div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
<span className="material-symbols-rounded text-primary">hub</span>
</div>
<h3 className="text-xl font-display font-bold dark:text-white mb-3">Mind Architecture</h3>
<p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Map the neural pathways of your belief systems to understand why you think the way you do.
                </p>
</div>
<div className="glass-card p-8 rounded-2xl">
<div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
<span className="material-symbols-rounded text-primary">shield_person</span>
</div>
<h3 className="text-xl font-display font-bold dark:text-white mb-3">Secure Sanctuary</h3>
<p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Your data is yours alone. Protected by industry-leading Shield encryption and zero-knowledge storage.
                </p>
</div>
</div>
</section>
<section className="py-24 max-w-7xl mx-auto px-6">
<div className="glass-card rounded-[2.5rem] overflow-hidden grid lg:grid-cols-2">
<div className="p-12 md:p-16 flex flex-col justify-center">
<h2 className="text-4xl md:text-5xl font-display font-bold dark:text-white mb-6">Ready to dig <br />deeper?</h2>
<p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-md">
                    Join 10,000+ explorers uncovering the foundations of their cognitive landscape.
                </p>
<ul className="space-y-4">
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-rounded text-primary text-xl">check_circle</span>
                        Personalized Mind Mapping
                    </li>
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-rounded text-primary text-xl">check_circle</span>
                        Weekly AI Growth Reports
                    </li>
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-rounded text-primary text-xl">check_circle</span>
                        Encrypted Journal Access
                    </li>
</ul>
</div>
<div className="p-8 md:p-12 bg-slate-900/40 border-l border-white/5">
<div className="glass-card p-8 rounded-3xl bg-white/5 max-w-md mx-auto">
<h3 className="text-xl font-display font-bold dark:text-white mb-8 text-center">Create Account</h3>
<button className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 px-6 py-3.5 rounded-xl font-semibold transition-all mb-6 google-btn-shadow group">
<svg className="w-5 h-5" viewBox="0 0 24 24">
<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"  /></path>
<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"  /></path>
<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"  /></path>
<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"  /></path>
</svg>
<span>Continue with Google</span>
</button>
<div className="relative flex items-center justify-center mb-6">
<div className="flex-grow border-t border-white/10"></div>
<span className="px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">or</span>
<div className="flex-grow border-t border-white/10"></div>
</div>
<form className="space-y-4">
<div>
<label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">Full Name</label>
<input className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary placeholder:text-slate-600 dark:text-white" placeholder="John Doe" type="text" />
</div>
<div>
<label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">Email Address</label>
<input className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary placeholder:text-slate-600 dark:text-white" placeholder="john@example.com" type="email" />
</div>
<button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-4 rounded-xl transition-all shadow-lg shadow-primary/20 mt-4" type="submit">
                            Start Your Expedition
                        </button>
</form>
<p className="text-[10px] text-center text-slate-500 mt-6 leading-relaxed">
                        By signing up, you agree to our <a className="underline" href="#">Terms of Service</a> and <a className="underline" href="#">Privacy Policy</a>.
                    </p>
</div>
</div>
</div>
</section>
<footer className="py-12 border-t border-slate-200/10 max-w-7xl mx-auto px-6">
<div className="flex flex-col md:flex-row items-center justify-between gap-8">
<div className="flex items-center gap-2">
<span className="material-symbols-rounded text-primary">psychology</span>
<span className="text-xs font-medium dark:text-slate-400">© 2024 MindRoots AI. All rights reserved.</span>
</div>
<div className="flex gap-8 text-[11px] font-semibold tracking-wide uppercase text-slate-500">
<a className="hover:text-primary transition-colors" href="#">Privacy</a>
<a className="hover:text-primary transition-colors" href="#">Security</a>
<a className="hover:text-primary transition-colors" href="#">Contact</a>
<a className="hover:text-primary transition-colors" href="#">Twitter</a>
</div>
</div>
</footer>

    </>
  );
}
