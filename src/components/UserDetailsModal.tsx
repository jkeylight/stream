import React, { useState } from 'react';
import {
  User,
  Shield,
  ShieldCheck,
  X,
  Mail,
  Key,
  Cpu,
  Download,
  CheckCircle2,
  Lock,
  Layers,
  Settings2,
  FileText
} from 'lucide-react';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'Jkeylight@gmail.com'
}) => {
  const [strictArmor, setStrictArmor] = useState(true);
  const [autoReferer, setAutoReferer] = useState(true);
  const [popupKill, setPopupKill] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const sessionToken = 'sa_live_9f81a7b293c04d1ef9a8b7c6';

  const handleCopyToken = () => {
    navigator.clipboard.writeText(sessionToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleDownloadSessionDoc = () => {
    window.open('/sessions.md', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">StreamArmor Operator Profile</h2>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-400 ring-1 ring-cyan-500/30">
                  Active Session
                </span>
              </div>
              <p className="text-xs text-slate-400">Security credentials, session policies, and threat telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Authenticated Identity
            </div>
            <div className="flex items-center gap-2 text-white font-mono text-sm break-all">
              <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>{userEmail}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span>Security Clearance:</span>
              <span className="text-slate-200 font-medium">Lead Threat Analyst</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>License / Shield Tier:</span>
              <span className="text-cyan-400 font-medium">Enterprise Unrestricted</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Session Environment
            </div>
            <div className="flex items-center gap-2 text-slate-200 text-xs font-mono">
              <Cpu className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Node.js v22 · Python 3.10.12</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span>Headless Engine:</span>
              <span className="text-slate-200 font-mono">Playwright Chromium</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Session Key:</span>
              <button
                onClick={handleCopyToken}
                className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>{copiedToken ? 'Copied Token!' : `${sessionToken.slice(0, 12)}...`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hardened Security Policies */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Settings2 className="h-4 w-4 text-cyan-400" />
            <span>Active Protection Policies</span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-pointer">
              <div>
                <div className="font-medium text-slate-200">Strict Payload Armor</div>
                <div className="text-slate-400 text-[11px]">Hard-blocks .exe, .scr, .bat, .apk before network dispatch</div>
              </div>
              <input
                type="checkbox"
                checked={strictArmor}
                onChange={(e) => setStrictArmor(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-pointer">
              <div>
                <div className="font-medium text-slate-200">Automated Origin Referer Spoofing</div>
                <div className="text-slate-400 text-[11px]">Prevents HTTP 403 anti-leech blocks on CDN media streams</div>
              </div>
              <input
                type="checkbox"
                checked={autoReferer}
                onChange={(e) => setAutoReferer(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-pointer">
              <div>
                <div className="font-medium text-slate-200">Zero-Delay Anti-Popup Radar</div>
                <div className="text-slate-400 text-[11px]">Instantly terminates window.open() cascades before impression registration</div>
              </div>
              <input
                type="checkbox"
                checked={popupKill}
                onChange={(e) => setPopupKill(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Profile Synced with sessions.md</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/sessions.md"
              target="_blank"
              download="streamarmor-sessions.md"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span>Download sessions.md</span>
            </a>
            <button
              onClick={onClose}
              className="rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
