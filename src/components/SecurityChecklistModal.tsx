import React from 'react';
import { ShieldCheck, X, AlertTriangle, CheckCircle2, Monitor, FileWarning } from 'lucide-react';

interface SecurityChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityChecklistModal: React.FC<SecurityChecklistModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Pre-Extraction Security Checklist</h2>
              <p className="text-xs text-slate-400">Essential rules before extracting any .rar or .zip archive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">1. Scan the Archive with VirusTotal</div>
              <p className="mt-1 text-slate-400 leading-relaxed">
                Before double-clicking or extracting, submit the .rar file or its SHA-256 hash to VirusTotal. If 3+ vendors flag it, delete it immediately.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 flex items-start gap-3">
            <Monitor className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">2. Open Inside Windows Sandbox or Fresh VM</div>
              <p className="mt-1 text-slate-400 leading-relaxed">
                Press <code className="text-cyan-300 font-mono">Windows Key</code>, type <code className="text-cyan-300 font-mono">Windows Sandbox</code>, and press Enter. Copy the downloaded archive inside. Anything malicious is wiped cleanly when the sandbox closes.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 flex items-start gap-3">
            <FileWarning className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">3. Inspect File Extensions Before Opening</div>
              <p className="mt-1 text-slate-400 leading-relaxed">
                Expected video files: <span className="text-emerald-400 font-mono">.mp4</span>, <span className="text-emerald-400 font-mono">.mkv</span>, <span className="text-emerald-400 font-mono">.avi</span>.
                <br />
                Dangerous payloads: <span className="text-rose-400 font-mono">.exe</span>, <span className="text-rose-400 font-mono">.scr</span>, <span className="text-rose-400 font-mono">.bat</span>, <span className="text-rose-400 font-mono">.lnk</span>, <span className="text-rose-400 font-mono">.vbs</span>, <span className="text-rose-400 font-mono">.iso</span>. Never launch executable files.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-rose-900/50 bg-rose-950/30 p-3.5 flex items-start gap-3 text-rose-200">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-100">4. Beware Password-Protected Archives</div>
              <p className="mt-1 text-rose-300 leading-relaxed">
                "Password is on our Telegram / visit this link for password" is a standard antivirus evasion lure. Password protection prevents AV engines from scanning inside. Treat password-gated archives from hostile sites as malicious.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            I Understand the Security Protocols
          </button>
        </div>
      </div>
    </div>
  );
};
