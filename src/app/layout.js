import './globals.css'
import PageTransition from '@/components/PageTransition'

export const metadata = {
  title: 'MindRoots — AI Belief Archaeology',
  description: 'Excavate the hidden origins of your limiting beliefs through AI-powered voice interviews. Discover your Belief Origin Tree.',
  keywords: 'belief archaeology, AI therapy, limiting beliefs, cognitive patterns, mindset',
}

export const viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="bg-[#0A0A0A] text-slate-300 min-h-screen" suppressHydrationWarning>
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  )
}
