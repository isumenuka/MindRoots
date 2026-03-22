/**
 * TTSService.js
 * Handles requests to the backend Gemini TTS endpoint.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

class TTSService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generates audio from text using Gemini TTS.
   * @param {string} text - The text to speak.
   * @param {Object} options - voice, style, speed, pitch.
   * @returns {Promise<string>} - A URL for the audio blob.
   */
  async generateAudio(text, options = {}) {
    if (!text) return null;

    const cacheKey = JSON.stringify({ text, ...options });
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: options.voice || 'Puck',
          style: options.style || 'A calm, wise narrator uncovering deep insights.',
          speed: options.speed,
          pitch: options.pitch,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      this.cache.set(cacheKey, audioUrl);
      return audioUrl;
    } catch (error) {
      console.error('[TTSService] Failed to generate audio:', error);
      throw error;
    }
  }

  /**
   * Clears the audio cache to free up memory.
   */
  clearCache() {
    for (const url of this.cache.values()) {
      URL.revokeObjectURL(url);
    }
    this.cache.clear();
  }
}

export const ttsService = new TTSService();
