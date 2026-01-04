
import React, { useState, useRef, useEffect } from 'react';
import { chatWithOwl } from '../services/geminiService';
import { Message } from '../types';

const WisdomEngine: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Welcome to the Wisdom Engine. I am the Owl. How may I enlighten your path through the darkness tonight?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithOwl(input);
      const modelMsg: Message = { role: 'model', text: response || 'Silence fills the woods...', timestamp: new Date() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error in transmission. The night is quiet.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-4xl mx-auto rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-sm font-bold uppercase tracking-widest text-white">Wisdom node 01</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono tracking-widest">GEMINI-3-PRO-PREVIEW</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-5 py-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-amber-500 text-black font-medium' 
                : 'bg-white/10 text-slate-200 border border-white/5'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <span className={`text-[10px] mt-2 block opacity-50 ${msg.role === 'user' ? 'text-black' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/5 flex gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#030507]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your inquiry..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-amber-500/50 text-white placeholder-slate-600 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-3 p-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all disabled:opacity-50 disabled:grayscale"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WisdomEngine;
