import React, { useState } from 'react';
import { Header } from './components/Header';
import { StreamRadar } from './components/StreamRadar';
import { LiveStreamer } from './components/LiveStreamer';
import { ScriptHub } from './components/ScriptHub';
import { HostileDeconstruction } from './components/HostileDeconstruction';
import { DevToolsGuide } from './components/DevToolsGuide';
import { SecurityChecklistModal } from './components/SecurityChecklistModal';
import { UserDetailsModal } from './components/UserDetailsModal';
import { Shield, Lock, Terminal, Github, User } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('radar');
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const userEmail = 'Jkeylight@gmail.com';

  // Cross-tab passing
  const [downloadTarget, setDownloadTarget] = useState<{
    url: string;
    filename: string;
    referer?: string;
  }>({
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    filename: 'BigBuckBunny.mp4'
  });

  const handleTriggerDownload = (url: string, filename: string, referer?: string) => {
    setDownloadTarget({ url, filename, referer });
    setActiveTab('downloader');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickInspect={() => {
          setActiveTab('radar');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        userEmail={userEmail}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'radar' && (
          <StreamRadar
            onTriggerDownload={handleTriggerDownload}
            onOpenChecklist={() => setIsChecklistOpen(true)}
          />
        )}

        {activeTab === 'downloader' && (
          <LiveStreamer
            initialDownloadUrl={downloadTarget.url}
            initialFilename={downloadTarget.filename}
            initialReferer={downloadTarget.referer}
          />
        )}

        {activeTab === 'scripts' && <ScriptHub />}

        {activeTab === 'deconstruction' && <HostileDeconstruction />}

        {activeTab === 'devtools' && <DevToolsGuide />}
      </main>

      {/* User Details & Operator Profile Modal */}
      <UserDetailsModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userEmail={userEmail}
      />

      {/* Security Checklist Modal */}
      <SecurityChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
      />

      {/* Quiet, Clean Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span>StreamArmor Toolkit</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Script Stream Interception & Payload Armor</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="hover:text-slate-300 transition-colors font-mono text-[11px]"
            >
              Operator: {userEmail}
            </button>
            <button
              onClick={() => setIsChecklistOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Pre-Extraction Protocol
            </button>
            <button
              onClick={() => setActiveTab('scripts')}
              className="hover:text-slate-300 transition-colors"
            >
              Desktop .EXE Guide
            </button>
            <button
              onClick={() => setActiveTab('devtools')}
              className="hover:text-slate-300 transition-colors"
            >
              DevTools Snippets
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
