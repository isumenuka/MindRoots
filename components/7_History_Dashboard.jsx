import React from 'react';

export default function HistoryDashboard() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    ` }} />
      
<div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
<div className="layout-container flex h-full grow flex-col">
{/*  Top Navigation Bar  */}
<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 py-4 lg:px-10">
<div className="flex items-center gap-4 text-primary">
<div className="flex items-center justify-center p-2 rounded-lg bg-accent/20 text-accent">
<span className="material-symbols-outlined">psychology</span>
</div>
<h2 className="text-primary text-lg font-bold leading-tight tracking-tight font-outfit">MindRoots</h2>
</div>
<div className="flex flex-1 justify-end gap-4 lg:gap-8 items-center">
<label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
<div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-white/5 border border-white/10">
<div className="text-secondary flex items-center justify-center pl-4">
<span className="material-symbols-outlined text-xl">search</span>
</div>
<input className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 h-full placeholder:text-secondary px-4 pl-2 text-sm font-normal" placeholder="Search sessions..." value="" />
</div>
</label>
<div className="flex gap-2">
<button className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined text-xl">calendar_today</span>
</button>
<button className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined text-xl">tune</span>
</button>
</div>
<div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 border border-white/20" data-alt="User profile avatar showing abstract pattern" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuA6UCaXwp8svz4z9hMBYNyZHWzoxgIC2zKcStPt-MzDDMeXDmURL8F-6KVKoSA_v-VauORVo3odDOdcA9d04mgNSOJbcyq4TcVo4Kz6nCSS7QD9NGto-1kkQCjkMmvWdkxjuWPueX-rXxxskQCvHra5Fv5BEdS0Yv_EaugRIPoXyAXY0mI7_AZKwNik25sccJlpdc_m5_iWlFR81vh_Jgu6huNjLvMAcN-lmEZ8ErcsB7q3GsMnxiYI2g2BtfnPRdTWYgiZZYlESow");'>
</div>
</div>
</header>
<div className="flex flex-1 flex-col lg:flex-row">
{/*  Sidebar Navigation  */}
<aside className="w-full lg:w-64 border-r border-white/10 p-4 flex flex-col gap-6">
<div className="flex flex-col gap-2">
<p className="px-3 text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Navigation</p>
<a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-all" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="text-sm font-medium">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent text-white shadow-lg shadow-accent/20" href="#">
<span className="material-symbols-outlined">folder_open</span>
<span className="text-sm font-medium">Archives</span>
</a>
<a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-all" href="#">
<span className="material-symbols-outlined">insights</span>
<span className="text-sm font-medium">Insights</span>
</a>
<a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-all" href="#">
<span className="material-symbols-outlined">settings</span>
<span className="text-sm font-medium">Settings</span>
</a>
</div>
<div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
<p className="text-xs text-accent font-bold mb-1">PRO PLAN</p>
<p className="text-sm text-slate-100 font-medium mb-3">Unlimited reflections &amp; deep insights active.</p>
<div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
<div className="bg-accent h-full w-3/4"></div>
</div>
</div>
</aside>
{/*  Main Content Area  */}
<main className="flex-1 p-6 lg:p-10 overflow-y-auto">
<div className="max-w-6xl mx-auto">
{/*  Content Header  */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
<div className="flex flex-col gap-1">
<h1 className="text-slate-100 text-3xl md:text-4xl font-black leading-tight tracking-tight font-outfit">Your Archives</h1>
<p className="text-secondary text-base lg:text-lg">A reflective gallery of your past mental landscapes.</p>
</div>
<button className="bg-primary text-background-dark px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2">
<span className="material-symbols-outlined text-lg">add</span>
                                New Session
                            </button>
</div>
{/*  Grid of Session Cards  */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{/*  Card 1  */}
<div className="glass-card rounded-xl overflow-hidden group hover:border-accent/50 transition-all duration-300">
<div className="h-40 w-full bg-center bg-cover relative" data-alt="Abstract blue and purple fluid flow pattern" style='background-image: linear-gradient(to bottom, rgba(10,10,10,0.2), rgba(10,10,10,0.8)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAVb4HigggpK03R4uqOvoKhTuEmZFzvDOOHx3y2jOKIZEnPRMfKsLYXDBYA3I1Nfnqy-dTycwpBPQvkEdK53bYOhuY6GtfuNJzLcjkwojJGcIn5kGq9DpiGwjDa9C-7LjGy9I_weSwBdVIog2aWUpOAphrkNL8rhFLf85qEN2I0Hag5j7GHTXIg2tTTLwyUg3JjML56HAGLTNYS9EDcgDeVKJkMkYUmgbpZHADyFxmSoDiA2_4R2NkUsDmsw8zgr1FWl1WCzsMjjd8");'>
<div className="absolute top-4 right-4 bg-background-dark/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
<span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Identity</span>
</div>
</div>
<div className="p-6 flex flex-col gap-4">
<h3 className="text-slate-100 text-xl font-bold font-outfit group-hover:text-accent transition-colors">The Burden of Performance</h3>
<div className="flex items-center justify-between mt-auto">
<div className="flex flex-col">
<span className="text-secondary text-xs uppercase tracking-widest font-semibold">Session Date</span>
<span className="text-slate-400 text-sm font-display">Oct 24, 2026</span>
</div>
<div className="flex flex-col items-end">
<span className="text-secondary text-xs uppercase tracking-widest font-semibold">Depth</span>
<span className="text-slate-400 text-sm font-display">4 Beliefs</span>
</div>
</div>
</div>
</div>
{/*  Card 2  */}
<div className="glass-card rounded-xl overflow-hidden group hover:border-accent/50 transition-all duration-300">
<div className="h-40 w-full bg-center bg-cover relative" data-alt="Abstract golden and dark grey wave pattern" style='background-image: linear-gradient(to bottom, rgba(10,10,10,0.2), rgba(10,10,10,0.8)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDT8nthmBSxAqqhJHmrb77-fhfOd5kERXw8a15LUiDwxBq370rTOw_75UfZrOS5Xd9vl-DmQkjKz0qTQeAQPOS1O07L7zSkc-iOULnVifM5Bus-3pKvMLqmpreu5VtMPG7lerRyGICzYxEd2mpoyrUbnpufNbRjrPzJySrPpXsLemL6zQTLhkUh55vN8YHKT13SmuMxAxv-X1t7DFgcHQJYg-ctdg7bGYj3Tu0PdKdnufvHBrF-_CPPj2t5JnIIWtg5LJa1csUpxsE");'>
<div className="absolute top-4 right-4 bg-background-dark/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
<span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Anxiety</span>
</div>
</div>
<div className="p-6 flex flex-col gap-4">
<h3 className="text-slate-100 text-xl font-bold font-outfit group-hover:text-accent transition-colors">Fear of Scarcity</h3>
<div className="flex items-center justify-between mt-auto">
<div className="flex flex-col">
<span className="text-secondary text-xs uppercase tracking-widest font-semibold">Session Date</span>
<span className="text-slate-400 text-sm font-display">Sep 12, 2026</span>
</div>
<div className="flex flex-col items-end">
<span className="text-secondary text-xs uppercase tracking-widest font-semibold">Depth</span>
<span className="text-slate-400 text-sm font-display">3 Beliefs</span>
</div>
</div>
</div>
</div>
{/*  Card 3  */}
<div className="glass-card rounded-xl overflow-hidden group hover:border-accent/50 transition-all duration-300">
<div className="h-40 w-full bg-center bg-cover relative" data-alt="Deep green and charcoal abstract textured gradient" style='background-image: linear-gradient(to bottom, rgba(10,10,10,0.2), rgba(10,10,10,0.8)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuB1eOWw9kPq14WtEXgpQp2bHhJQuZ2f6oHY4nfFfZ6PF7l79hvqVIHD9rDumo9DNIfK8qIo2_D8xDK_kC5dqZD7149eZFj_eUoVu9T8HZpVGJn34xupcLaunEUmhMgwDWX-DzIfSCtLNGFTS4Xt_DCCklOJ9bOttejNmsM9CckQGm4LXDISsebmp3LF4ZGq_R8L_R0ZvDDI1LLCMvqRcE9Z0iJ0Oxri-wMBzQiyMoz6xr8jVLRgQh9MRcIuEoFYEYl13GZ5xIefI_g");'>
<div className="absolute top-4 right-4 bg-background-dark/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
<span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Social</span>
</div>
</div>
<div className="p-6 flex flex-col gap-4">
<h3 className="text-slate-100 text-xl font-bold font-outfit group-hover:text-accent transition-colors">Avoidance of Conflict</h3>
<div className="flex items-center justify-between mt-auto">
<div className="flex flex-col">
<span className="text-secondary text-xs uppercase tracking-widest font-semibold">Session Date</span>
<span className="text-slate-400 text-sm font-display">Aug 05, 2026</span>
</div>
<div className="flex flex-col items-end">
<span className="text-secondary text-xs uppercase tracking-widest font-semibold">Depth</span>
<span className="text-slate-400 text-sm font-display">5 Beliefs</span>
</div>
</div>
</div>
</div>
{/*  Empty Slot for Reflection  */}
<div className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-10 group hover:border-accent/30 transition-all cursor-pointer">
<div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
<span className="material-symbols-outlined text-secondary group-hover:text-accent">history_edu</span>
</div>
<p className="text-secondary text-sm font-medium text-center">Start a new reflective journey to grow your archive.</p>
</div>
</div>
</div>
</main>
</div>
</div>
</div>

    </>
  );
}
