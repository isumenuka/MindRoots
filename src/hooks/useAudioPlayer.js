import { useState, useCallback, useRef } from 'react';

export default function useAudioPlayer(sampleRate = 24000) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const nextTimeRef = useRef(0);

  const init = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate,
      });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, [sampleRate]);

  const stopPlayback = useCallback(() => {
    // Clear audio queue conceptually by resetting nextTimeRef to current time.
    if (audioContextRef.current) {
      nextTimeRef.current = audioContextRef.current.currentTime;
    }
    setIsPlaying(false);
  }, []);

  const playChunk = useCallback((base64String) => {
    if (!audioContextRef.current) return;
    
    // Decode base64 to Int16Array
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    
    // Convert Int16Array to Float32Array (-1.0 to 1.0)
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.copyToChannel(float32Array, 0);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyserRef.current);

    const currentTime = audioContextRef.current.currentTime;
    if (nextTimeRef.current < currentTime) {
      nextTimeRef.current = currentTime; // Buffer underrun, start immediately
    }

    source.start(nextTimeRef.current);
    nextTimeRef.current += audioBuffer.duration;
    setIsPlaying(true);

    source.onended = () => {
      // Re-evaluate if this was the last queued chunk
      if (audioContextRef.current && audioContextRef.current.currentTime >= nextTimeRef.current) {
        setIsPlaying(false);
      }
    };
  }, [sampleRate]);

  const stop = useCallback(() => {
    stopPlayback();
    if (audioContextRef.current) {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
        analyserRef.current = null;
      });
    }
  }, [stopPlayback]);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return { init, playChunk, stopPlayback, stop, getAnalyser, isPlaying };
}
