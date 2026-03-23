import Link from 'next/link';
import AppLogo from '@/components/AppLogo';

export default function PrivacyPage() {
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
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p className="lead text-lg text-slate-400 mb-8">
            At MindRoots AI, your privacy is our top priority. This document outlines how we collect, use, and protect your data.
          </p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Data Collection</h2>
          <p className="mb-4">We collect information that you proactively provide to us during your interaction with our AI agents. This includes transcripts of your voice interviews and the structured Belief Origin Trees we generate for you. We also collect standard account information needed for authentication.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Data Usage</h2>
          <p className="mb-4">Your personal data is strictly used to provide, maintain, and improve the MindRoots service. Your voice sessions are processed by our backend for transcription and analysis only to deliver your origin trees and insights.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Data Protection</h2>
          <p className="mb-4">All data transmitted between your device and our servers is encrypted in transit using industry-standard protocols. Your data is stored securely in our database, with strict access controls to prevent unauthorized access.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Your Rights</h2>
          <p className="mb-4">You have the right to access, edit, or delete your data at any time. You can manage your preferences directly from the Settings page within the app.</p>
        </div>
      </main>
    </>
  );
}
