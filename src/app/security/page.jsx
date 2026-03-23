import Link from 'next/link';
import AppLogo from '@/components/AppLogo';

export default function SecurityPage() {
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
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Security Protocol</h1>
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p className="lead text-lg text-slate-400 mb-8">
            Security is foundational to our infrastructure. Here's how we keep your inner world safe.
          </p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Infrastructure Security</h2>
          <p className="mb-4">Our application is hosted on secure cloud infrastructure provided by Google Cloud Platform. We rely on their robust, enterprise-grade security protocols for identity, access, and infrastructure management.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Authentication</h2>
          <p className="mb-4">We use Firebase Authentication to handle user sign-ups and logins securely. We do not store your passwords manually; all authentication is brokered directly through identity providers.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Data Privacy & Encryption</h2>
          <p className="mb-4">We employ Firestore security rules to guarantee that only you can access your data. Transcripts and history cannot be accessed by other users. Data is encrypted at rest and in transit.</p>
        </div>
      </main>
    </>
  );
}
