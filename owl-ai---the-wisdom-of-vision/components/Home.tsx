
import React from 'react';
import { AppSection } from '../types';

interface HomeProps {
  onNavigate: (section: AppSection) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <section className="text-center py-12 md:py-24 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Omniscient intelligence active</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
          See What Others <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Miss.</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
          The world's most sophisticated AI ecosystem built for deep reasoning and multi-sensory intelligence. 
          Step into the night.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => onNavigate(AppSection.WISDOM)}
            className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-xl shadow-amber-500/10 hover:scale-105"
          >
            Launch Wisdom Engine
          </button>
          <button 
            onClick={() => onNavigate(AppSection.VISION)}
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
          >
            Try Night Vision
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Wisdom engine",
            desc: "Ultra-fast reasoning with our custom 3.0 Pro neural model.",
            icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
            target: AppSection.WISDOM
          },
          {
            title: "Night vision",
            desc: "Identify, analyze, and interpret visual data in any lighting condition.",
            icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
            target: AppSection.VISION
          },
          {
            title: "Live perch",
            desc: "Instant voice interaction with low-latency human-like response.",
            icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-6 0V5a3 3 0 013-3z",
            target: AppSection.LIVE
          }
        ].map((feature, idx) => (
          <div 
            key={idx} 
            className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-amber-500/20 hover:bg-white/[0.07] transition-all cursor-pointer"
            onClick={() => onNavigate(feature.target)}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
              </svg>
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home;
