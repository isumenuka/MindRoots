import Link from 'next/link';
import AppLogo from '@/components/AppLogo';

export default function TermsPage() {
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

      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p className="lead text-lg text-slate-400 mb-8">
            Please read these terms carefully before using the MindRoots AI platform.
          </p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing or using MindRoots, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access the service.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Description of Service</h2>
          <p className="mb-4">MindRoots AI provides an AI-driven platform for belief excavation through voice interviews and visual mapping tools. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. User Conduct</h2>
          <p className="mb-4">You are responsible for all content associated with your account. You agree not to use the service for any illegal or unauthorized purpose.</p>
        </div>
      </main>
    </>
  );
}
