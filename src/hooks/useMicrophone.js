import { useState, useCallback, useRef } from 'react';

export default function useMicrophone(sampleRate = 16000) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const analyserRef = useRef(null);

  const start = useCallback(async (onData, onStop) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      setHasPermission(true);
      setError(null);

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate,
      });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      mediaStreamRef.current = stream;

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Using ScriptProcessorNode for maximum compatibility without needing additional workers/worklets
      const bufferSize = 4096;
      const processor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 (-1.0 to 1.0) down to Int16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert Int16Array to base64 string directly
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        if (onData) onData(base64);
      };

      analyserRef.current.connect(processor);
      // Connect to destination to prevent garbage collection (creates a feedback loop normally,
      // but we use echo cancellation. A better approach is connecting to a muted gain node)
      const muteNode = audioContextRef.current.createGain();
      muteNode.gain.value = 0;
      processor.connect(muteNode);
      muteNode.connect(audioContextRef.current.destination);
      processorRef.current = processor;

      // Store onStop callback cleanly inside ref
      processorRef.current.onStopCallback = onStop;

      setIsCapturing(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setError(err.message || 'Microphone error');
      setIsCapturing(false);
      throw err;
    }
  }, [sampleRate]);

  const stop = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      if (processorRef.current.onStopCallback) {
        processorRef.current.onStopCallback();
      }
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return { isCapturing, hasPermission, error, start, stop, getAnalyser };
}
