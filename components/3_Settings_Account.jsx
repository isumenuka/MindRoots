import React from 'react';

export default function SettingsAccount() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
            font-family: 'Inter', sans-serif;
            background-color: #0A0A0A;
            color: #A3A3A3;
        }
        .heading-font {
            font-family: 'Outfit', sans-serif;
        }
    ` }} />
      
<div className="relative flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
{/*  Sidebar  */}
<aside className="w-72 flex flex-col border-r border-border-muted bg-background-light dark:bg-background-dark h-full">
<div className="p-8 flex items-center gap-3">
<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined text-background-dark font-bold text-xl">psychology_alt</span>
</div>
<h2 className="heading-font text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">MindRoots</h2>
</div>
<nav className="flex-1 px-4 space-y-2 mt-4">
<a className="flex items-center gap-4 px-4 py-3 rounded-lg bg-primary/10 text-primary transition-all group" href="#">
<span className="material-symbols-outlined text-[22px]">person</span>
<span className="heading-font font-medium">Profile</span>
</a>
<a className="flex items-center gap-4 px-4 py-3 rounded-lg text-text-muted hover:bg-white/5 hover:text-slate-100 transition-all group" href="#">
<span className="material-symbols-outlined text-[22px]">shield_lock</span>
<span className="heading-font font-medium">Privacy</span>
</a>
<a className="flex items-center gap-4 px-4 py-3 rounded-lg text-text-muted hover:bg-white/5 hover:text-slate-100 transition-all group" href="#">
<span className="material-symbols-outlined text-[22px]">credit_card</span>
<span className="heading-font font-medium">Billing</span>
</a>
</nav>
<div className="p-4 border-t border-border-muted">
<button className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-text-muted hover:text-danger transition-colors group">
<span className="material-symbols-outlined text-[22px]">logout</span>
<span className="heading-font font-medium">Logout</span>
</button>
</div>
</aside>
{/*  Main Content  */}
<main className="flex-1 overflow-y-auto scroll-smooth">
<header className="h-20 flex items-center justify-between px-12 border-b border-border-muted/50 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10">
<div className="flex items-center gap-2 text-text-muted text-sm uppercase tracking-widest font-medium">
<span>Account</span>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<span className="text-slate-100">Settings</span>
</div>
<button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors border border-border-muted">
<span className="material-symbols-outlined text-slate-100">settings</span>
</button>
</header>
<div className="max-w-3xl mx-auto py-16 px-8 space-y-12">
{/*  Hero Section  */}
<section className="flex items-center gap-8 border-b border-border-muted pb-12">
<div className="relative group">
<div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-purple-600 p-[2px]">
<div className="w-full h-full rounded-full bg-background-dark flex items-center justify-center overflow-hidden">
<img alt="Profile avatar" className="w-full h-full object-cover opacity-80" data-alt="Modern minimalist aesthetic portrait of a person" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSw0nuBtu_CSLT_MVjU7LtKxF4s__pTXVMpTEvbI4J0z_A14-CHIBjhyoTgIM259bt0jqX3ABJqs0OdfGNMXUfwtY4UudjgM7jWcAPOw_Xmu9LwIUn6whY_n3od3N6E2rDqNQH0Y8VFbUmtVJxfHAVnI03ntIJ5TR3CH2CkrpdBnjZlSVZ8qbtkmAuxYYdKtOAONyWwIlitxeqTSffqdzlo9A1YJ2PYPbvCAHy_u0IgdP5YSq51AB3O3ZqTRIvnPqdGKP8amnTrdg" />
</div>
</div>
<button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-background-dark shadow-xl hover:scale-105 transition-transform">
<span className="material-symbols-outlined text-sm">edit</span>
</button>
</div>
<div>
<h1 className="heading-font text-4xl font-bold text-slate-100 tracking-tight">Believer #402</h1>
<p className="text-text-muted text-lg font-light tracking-wide mt-1 italic">Archaeologist of the Mind</p>
</div>
</section>
{/*  Details Section  */}
<section className="grid gap-8">
<div className="flex flex-col gap-2 group">
<label className="heading-font text-xs font-bold uppercase tracking-widest text-text-muted/60 ml-1">Email address</label>
<div className="flex items-center justify-between px-5 py-4 bg-white/5 border border-border-muted rounded-xl">
<span className="text-slate-200">user@example.com</span>
<span className="material-symbols-outlined text-text-muted/50 cursor-pointer hover:text-primary">verified</span>
</div>
</div>
<div className="flex flex-col gap-2">
<label className="heading-font text-xs font-bold uppercase tracking-widest text-text-muted/60 ml-1">Journey Started</label>
<div className="px-5 py-4 bg-white/5 border border-border-muted rounded-xl text-slate-200">
                        October 2026
                    </div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
<div className="p-6 border border-border-muted rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
<span className="material-symbols-outlined text-accent mb-3">database</span>
<h4 className="heading-font text-slate-100 font-medium mb-1">Firestore Stats</h4>
<p className="text-xs text-text-muted">142 Belief nodes mapped</p>
</div>
<div className="p-6 border border-border-muted rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
<span className="material-symbols-outlined text-accent mb-3">cloud_done</span>
<h4 className="heading-font text-slate-100 font-medium mb-1">GCS Usage</h4>
<p className="text-xs text-text-muted">2.4 GB media archived</p>
</div>
</div>
</section>
{/*  Danger Zone  */}
<section className="mt-20 pt-12 border-t border-border-muted">
<div className="flex items-center gap-2 mb-6 text-danger">
<span className="material-symbols-outlined">warning</span>
<h3 className="heading-font text-lg font-bold tracking-tight">Danger Zone</h3>
</div>
<div className="p-8 border border-danger/30 rounded-xl bg-danger/5 flex flex-col md:flex-row items-center justify-between gap-6">
<div className="max-w-md">
<p className="text-slate-100 font-medium heading-font">Account Deletion</p>
<p className="text-text-muted text-sm leading-relaxed mt-1">
                            Permanently delete your account, wiping all Firestore documents and GCS media. This action is irreversible.
                        </p>
</div>
<button className="whitespace-nowrap px-6 py-3 bg-danger text-slate-100 heading-font font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-danger/20">
                        Delete All My Data
                    </button>
</div>
</section>
<footer className="pt-20 pb-12 flex justify-center opacity-30">
<div className="flex items-center gap-2 grayscale brightness-200">
<span className="material-symbols-outlined text-sm">psychology_alt</span>
<span className="text-xs heading-font font-bold uppercase tracking-[0.2em]">MindRoots Protocol v4.0.2</span>
</div>
</footer>
</div>
</main>
</div>

    </>
  );
}
