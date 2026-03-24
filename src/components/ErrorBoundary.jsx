'use client'
import React from 'react'

/**
 * ErrorBoundary — catches uncaught runtime errors in the React tree.
 * Wrap this around the app in layout.js.
 * Shows a friendly recovery UI instead of a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-6 text-center">
        {/* Ambient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-md">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-red-400 text-[32px]">error</span>
          </div>

          <h1 className="text-2xl font-display font-bold text-white mb-3">Something went wrong</h1>
          <p className="text-slate-400 text-sm mb-2">
            An unexpected error occurred. If you were in a session, your beliefs were auto-saved.
          </p>
          {this.state.error && (
            <p className="text-xs text-slate-600 font-mono mb-8 bg-white/5 rounded-lg px-4 py-2 border border-white/5">
              {this.state.error.message}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Try Again
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
