import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAudioSettingsStore = create(
  persist(
    (set) => ({
      uiSoundsEnabled: true,
      setUiSoundsEnabled: (enabled) => set({ uiSoundsEnabled: enabled }),
    }),
    {
      name: 'mindroots-audio-settings',
    }
  )
)

// A lightweight utility to play sounds
class AudioManager {
  constructor() {
    this.audioPool = new Map()
  }

  play(filename, volume = 0.5) {
    if (typeof window === 'undefined') return
    
    // Check if UI sounds are enabled in user settings
    const enabled = useAudioSettingsStore.getState().uiSoundsEnabled
    if (!enabled) return

    try {
      let audio = this.audioPool.get(filename)
      if (!audio) {
        audio = new Audio(`/sounds/${filename}`)
        this.audioPool.set(filename, audio)
      }
      
      // Clone it to allow overlapping playback of the same sound
      const clone = audio.cloneNode()
      clone.volume = volume
      clone.play().catch(e => console.warn('Audio playback prevented by browser:', e))
    } catch (err) {
      console.warn('Failed to play sound:', err)
    }
  }
}

export const audioManager = new AudioManager()
