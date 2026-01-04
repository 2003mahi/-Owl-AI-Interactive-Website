
import React from 'react';
import { AppSection } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeSection, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#05070a] text-slate-200">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05070a]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate(AppSection.HOME)}
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 group-hover:border-amber-400 transition-all duration-300">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">OWL<span className="text-amber-500">AI</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { id: AppSection.HOME, label: 'Overview' },
              { id: AppSection.WISDOM, label: 'Wisdom engine' },
              { id: AppSection.VISION, label: 'Night vision' },
              { id: AppSection.LIVE, label: 'Live perch' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium transition-colors ${
                  activeSection === item.id ? 'text-amber-500' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button className="hidden sm:block text-xs uppercase tracking-widest font-bold border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 transition-colors">
              Node Active
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-[#030507] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© 2024 Owl AI. Observing the unseen.</p>
          <div className="flex gap-6 text-slate-500 text-sm">
            <a href="#" className="hover:text-amber-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
