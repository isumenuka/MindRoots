'use client'
import { useState } from 'react'

const SLIDES = [
  {
    icon: 'psychology',
    tag: 'What is Belief Archaeology?',
    title: 'Unearth the roots of your beliefs.',
    body: `MindRoots uses AI to excavate the exact origin moments behind the invisible mental frameworks silently running your decisions. Every belief you hold was planted by a specific person, in a specific moment — and we help you find exactly when and where.`,
  },
  {
    icon: 'mic',
    tag: 'The Interview',
    title: 'A voice conversation with a Socratic AI.',
    body: `You'll have a natural voice conversation with our AI archaeologist. It will ask gentle but persistent "why" questions until it reaches the bedrock moment behind each belief. Speak freely — you don't need to prepare anything. Up to 5 beliefs can be excavated per session.`,
  },
  {
    icon: 'shield_person',
    tag: 'Privacy First',
    title: 'Your beliefs stay yours.',
    body: `All data is stored only in your account under secure encryption. Person generation is completely disabled in all AI image calls. You can delete every trace of your data at any time from Settings. There is no cross-user data access — ever.`,
  },
]

export default function OnboardingModal({ onComplete }) {
  const [slide, setSlide] = useState(0)

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(slide + 1)
    else onComplete?.()
  }

  const s = SLIDES[slide]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative max-w-lg w-full mx-4 bg-[#111118] border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl">
        {/* Step dots */}
        <div className="flex gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === slide ? 'w-8 bg-[#818CF8]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#818CF8]/15 border border-[#818CF8]/20 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[#818CF8] text-3xl">{s.icon}</span>
        </div>

        {/* Tag */}
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#818CF8] mb-3">{s.tag}</p>

        {/* Title */}
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">{s.title}</h2>

        {/* Body */}
        <p className="text-slate-400 leading-relaxed text-sm lg:text-base mb-8">{s.body}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onComplete?.()}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Skip
          </button>
          <button
            onClick={next}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-all"
          >
            {slide < SLIDES.length - 1 ? 'Next' : 'Begin Excavation'}
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}
