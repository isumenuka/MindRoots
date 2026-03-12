import { useState, useCallback, useRef } from 'react';

export default function useAudioPlayer(sampleRate = 24000) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const isInitializedRef = useRef(false);
  // Use a ref for isPlaying inside playChunk to avoid stale closure
  const isPlayingRef = useRef(false);

  const init = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      // Create audio context at 24kHz to match Gemini output
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate,
      });

      // Load the audio worklet from public folder
      await audioContextRef.current.audioWorklet.addModule(
        "audio-processors/playback.worklet.js"
      );

      // Create worklet node
      workletNodeRef.current = new AudioWorkletNode(
        audioContextRef.current,
        "pcm-processor"
      );

      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 1.0;

      // Create analyser for visualizer
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Connect nodes: worklet → gain → analyser → speakers
      workletNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      isInitializedRef.current = true;
      console.log("🔊 Audio player initialized");
    } catch (error) {
      console.error("Failed to initialize audio player:", error);
      throw error;
    }
  }, [sampleRate]);

  const stopPlayback = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage("interrupt");
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  // Bug fix: no isPlaying in deps — avoids stale closure when onAudioChunk is set once at session init
  const playChunk = useCallback(async (base64Audio) => {
    if (!isInitializedRef.current) {
      await init();
    }

    try {
      // Bug fix: always resume — browser autoplay policy suspends AudioContext created before user gesture
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Handle odd byte length
      const binaryString = window.atob(base64Audio);
      const byteLength = binaryString.length;
      const validByteLength = byteLength % 2 !== 0 ? byteLength - 1 : byteLength;

      const bytes = new Uint8Array(validByteLength);
      for (let i = 0; i < validByteLength; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 LE → Float32
      const inputArray = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(inputArray.length);
      for (let i = 0; i < inputArray.length; i++) {
        float32Data[i] = inputArray[i] / 32768.0;
      }

      // Send to worklet for playback
      workletNodeRef.current.port.postMessage(float32Data);

      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio chunk:", error);
      throw error;
    }
  }, [init]); // removed isPlaying from deps — use ref instead

  const stop = useCallback(() => {
    stopPlayback();
    if (audioContextRef.current) {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
        workletNodeRef.current = null;
        gainNodeRef.current = null;
        analyserRef.current = null;
        isInitializedRef.current = false;
        isPlayingRef.current = false;
        setIsPlaying(false);
      });
    }
  }, [stopPlayback]);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return { init, playChunk, stopPlayback, stop, getAnalyser, isPlaying };
}
