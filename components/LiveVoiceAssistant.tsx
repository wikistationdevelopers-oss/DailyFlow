import React, { useEffect, useState, useRef } from 'react';
import { LiveServerMessage, Modality, Blob } from '@google/genai';
import { getLiveClient, LIVE_MODEL_NAME } from '../services/geminiService';
import { Theme } from '../types';

interface LiveVoiceAssistantProps {
  theme: Theme;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveVoiceAssistant: React.FC<LiveVoiceAssistantProps> = ({ theme, isOpen, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
  }, [isOpen]);

  // Visualizer Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (canvas && (status === 'connected' || isPlaying)) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const draw = () => {
                const width = canvas.width;
                const height = canvas.height;
                ctx.clearRect(0, 0, width, height);
                
                // Simple sine wave simulation for visualizer since we aren't tapping the exact analyzer node here for simplicity
                // In a full app, we would connect an AnalyserNode to outputAudioContext
                ctx.beginPath();
                ctx.moveTo(0, height / 2);
                
                const count = isPlaying ? 5 : 2; // More movement when speaking
                const speed = Date.now() / 150;
                
                for (let i = 0; i < width; i++) {
                   const y = height / 2 + Math.sin(i * 0.05 + speed) * (isPlaying ? 20 : 5) * Math.sin(i * 0.01);
                   ctx.lineTo(i, y);
                }
                
                ctx.strokeStyle = theme.color;
                ctx.lineWidth = 3;
                ctx.stroke();
                
                animationFrameId = requestAnimationFrame(draw);
            };
            draw();
        }
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [status, isPlaying, theme]);

  const startSession = async () => {
    setStatus('connecting');
    try {
      const ai = getLiveClient();
      
      // Setup Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // Get Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL_NAME,
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            setStatus('connected');
            
            // Input Audio Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
               setIsPlaying(true);
               
               // Decode Audio
               try {
                   nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                   const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                   
                   const source = outputCtx.createBufferSource();
                   source.buffer = audioBuffer;
                   source.connect(outputNode);
                   
                   source.onended = () => {
                       sourcesRef.current.delete(source);
                       if (sourcesRef.current.size === 0) setIsPlaying(false);
                   };
                   
                   source.start(nextStartTimeRef.current);
                   nextStartTimeRef.current += audioBuffer.duration;
                   sourcesRef.current.add(source);
               } catch (err) {
                   console.error("Audio Decode Error", err);
               }
             }
             
             if (message.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => s.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
                 setIsPlaying(false);
             }
          },
          onclose: () => {
             setStatus('idle');
          },
          onerror: (err) => {
             console.error("Live Error", err);
             setStatus('error');
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to start Live session", error);
      setStatus('error');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
        // We can't strictly cancel the promise, but we can close contexts
    }
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setStatus('idle');
    setIsPlaying(false);
  };

  // --- Helpers ---
  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Clamp values
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      
      for(let channel = 0; channel < numChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) {
             channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; 
          }
      }
      return buffer;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
       <div className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl animate-scale-up relative">
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10">
               <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
           </button>

           <div className={`p-8 text-center flex flex-col items-center justify-center min-h-[400px] ${theme.bgClass}`}>
               <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-lg transition-all duration-500 ${status === 'connected' ? 'bg-white' : 'bg-gray-200'}`}>
                   {status === 'connecting' && (
                       <svg className={`w-12 h-12 ${theme.textClass} animate-spin`} fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                   )}
                   {status === 'connected' && (
                       <svg className={`w-16 h-16 ${isPlaying ? theme.textClass : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                       </svg>
                   )}
                   {status === 'error' && (
                       <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                       </svg>
                   )}
               </div>

               <h3 className="text-xl font-bold text-gray-800 mb-2">
                   {status === 'connecting' && 'Connecting...'}
                   {status === 'connected' && (isPlaying ? 'Gemini is speaking' : 'Listening...')}
                   {status === 'error' && 'Connection Failed'}
               </h3>
               
               <p className="text-gray-500 text-sm mb-6">
                   {status === 'connected' ? 'Have a natural conversation.' : 'Please wait while we connect to the server.'}
               </p>

               {/* Visualizer Canvas */}
               <canvas ref={canvasRef} width="200" height="50" className="w-full h-12" />
           </div>
           
           <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
               <button onClick={onClose} className="text-red-500 font-medium hover:text-red-700 text-sm">
                   End Call
               </button>
           </div>
       </div>
    </div>
  );
};