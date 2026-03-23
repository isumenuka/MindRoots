import Link from 'next/link';
import AppLogo from '@/components/AppLogo';

export default function ContactPage() {
  return (
    <>
      <div suppressHydrationWarning className="fixed inset-0 bg-[#0A0A0A] -z-10" />
      <div suppressHydrationWarning className="fixed inset-0 hero-gradient -z-10 pointer-events-none" />
      <div suppressHydrationWarning className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#818CF8]/5 blur-[140px] rounded-full -z-10 pointer-events-none" />
      
      <nav suppressHydrationWarning className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 py-4 sm:py-5 flex items-center justify-between">
          <AppLogo />
          <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-lg mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Contact Us</h1>
        <p className="text-lg text-slate-400 mb-10">
          Have questions, feedback, or need support with your MindRoots account? We're here to help.
        </p>

        <div className="glass-card p-8 rounded-2xl bg-white/5 border border-white/10 text-left">
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#818CF8] text-sm">mail</span>
              Email Support
            </h3>
            <p className="text-slate-400 text-sm">You can reach me at <a href="mailto:isumenuka@gmail.com" className="text-[#818CF8] hover:underline">isumenuka@gmail.com</a>.</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#818CF8] text-sm">code</span>
              GitHub
            </h3>
            <p className="text-slate-400 text-sm">Check out my profile on GitHub: <a href="https://github.com/isumenuka" target="_blank" rel="noopener noreferrer" className="text-[#818CF8] hover:underline">@isumenuka</a>.</p>
          </div>
        </div>
      </main>
    </>
  );
}
