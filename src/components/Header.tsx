import React from 'react';
import { ShieldCheck, Terminal, Download, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickInspect: () => void;
  onOpenUserModal: () => void;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickInspect,
  onOpenUserModal,
  userEmail = 'Jkeylight@gmail.com'
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => setActiveTab('radar')}
          className="group flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30 group-hover:ring-cyan-500/50">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <span>StreamArmor</span>
        </button>

        {/* Zone 2: 4-5 Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('radar')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'radar'
                ? 'text-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Stream Radar
          </button>
          <button
            onClick={() => setActiveTab('downloader')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'downloader'
                ? 'text-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Live Downloader
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'scripts'
                ? 'text-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Python Hub (.exe)
          </button>
          <button
            onClick={() => setActiveTab('deconstruction')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'deconstruction'
                ? 'text-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Threat Analysis
          </button>
          <button
            onClick={() => setActiveTab('devtools')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'devtools'
                ? 'text-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            DevTools Guide
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenUserModal}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-colors whitespace-nowrap"
            title="View StreamArmor Operator Profile & Session Details"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="font-mono text-[11px]">{userEmail}</span>
          </button>

          <button
            onClick={onQuickInspect}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-cyan-400 active:scale-95 whitespace-nowrap shrink-0"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Probe Target</span>
          </button>
        </div>
      </div>
    </header>
  );
};
