
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decodeBase64Audio, pcmToFloat32, encodeAudioBuffer } from '../services/geminiService';

const LivePerch: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Dormant');
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const micStreamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    try {
      setStatus('Awakening...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('Perched');
            setIsActive(true);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encodeAudioBuffer(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await pcmToFloat32(decodeBase64Audio(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.outputTranscription) {
               setTranscription(prev => prev + ' ' + message.serverContent?.outputTranscription?.text);
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            setStatus('Connection severed');
            stopSession();
          },
          onclose: () => {
            setStatus('Dormant');
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }
          },
          systemInstruction: "You are the Owl. You speak in a deep, hushed, but clear voice. You are wise and respond instantly to the visitor's voice. Keep responses concise but profound.",
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start perch session:', err);
      setStatus('Awakening failed');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsActive(false);
    setStatus('Dormant');
    setTranscription('');
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col items-center gap-12 text-center">
      <div className="relative group">
        <div className={`absolute -inset-1 rounded-full blur-3xl transition-all duration-1000 ${
          isActive ? 'bg-amber-500/30 opacity-100 animate-pulse' : 'bg-amber-500/5 opacity-0'
        }`}></div>
        <div className={`w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
          isActive ? 'border-amber-500 scale-110 shadow-2xl shadow-amber-500/20' : 'border-white/10'
        }`}>
          <svg className={`w-16 h-16 transition-colors duration-500 ${isActive ? 'text-amber-500' : 'text-white/10'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-6 0V5a3 3 0 013-3z" />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-500 animate-ping' : 'bg-slate-700'}`}></span>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">{status}</h2>
        </div>
        <p className="text-slate-400 max-w-sm mx-auto">
          {isActive 
            ? "The Owl is listening. Speak your mind into the void." 
            : "Engage the mic to begin a low-latency vocal link with Owl AI."}
        </p>
      </div>

      {isActive ? (
        <button
          onClick={stopSession}
          className="px-12 py-5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-full font-bold transition-all"
        >
          Sever Connection
        </button>
      ) : (
        <button
          onClick={startSession}
          className="px-12 py-5 bg-amber-500 hover:bg-amber-400 text-black rounded-full font-bold transition-all shadow-xl shadow-amber-500/20 hover:scale-105"
        >
          Ascend to the Perch
        </button>
      )}

      {transcription && (
        <div className="w-full mt-8 p-6 rounded-3xl bg-white/5 border border-white/5 text-slate-400 text-sm leading-relaxed italic animate-in fade-in duration-500">
          "{transcription.slice(-300)}..."
        </div>
      )}
    </div>
  );
};

export default LivePerch;
