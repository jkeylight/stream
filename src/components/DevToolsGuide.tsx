import React, { useState } from 'react';
import {
  Terminal,
  Code,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';

export const DevToolsGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const STEPS = [
    {
      step: 1,
      title: 'Disable JavaScript for the Host Origin (Best Defense)',
      subtitle: 'Kills the anti-adblock detector AND the click-hijack in one stroke',
      explanation:
        'Because both the anti-adblock wall and the 20-tab click-hijack script are written in JavaScript, turning off JS completely defangs the page. If the file player is native HTML5, you can grab the link immediately without any scripts firing.',
      instructions: [
        'Chrome / Edge: Click the tune/padlock icon next to the address bar -> Site settings -> JavaScript -> set to "Block".',
        'Firefox: Install uBlock Origin or NoScript -> click extension icon -> toggle the "</>" (Disable JavaScript) symbol for that domain.'
      ],
      codeSnippet: null
    },
    {
      step: 2,
      title: 'Inspect Network Requests Without Left-Clicking',
      subtitle: 'Identify the raw CDN media stream or binary attachment',
      explanation:
        'Do not left-click buttons on the page. Use your browser developer tools to monitor the network pipeline directly.',
      instructions: [
        'Press F12 (or Right Click -> Inspect) and click the Network tab.',
        'Check the "Preserve log" checkbox so requests don\'t vanish.',
        'In the filter box, type "Media" or search for ".mp4", ".mkv", or ".rar".',
        'Right-click the largest request in the list -> Copy -> Copy link address.'
      ],
      codeSnippet: null
    },
    {
      step: 3,
      title: 'Unlock Chrome Console Self-XSS Protection',
      subtitle: 'Permits pasting inspection scripts without danger',
      explanation:
        'Modern browsers prevent pasting code into DevTools to protect users from self-XSS attacks. Unlock it safely to query the hidden download form.',
      instructions: [
        'Click the Console tab right next to the Network tab.',
        'Type "allow pasting" on the blank prompt line and press Enter.'
      ],
      codeSnippet: 'allow pasting'
    },
    {
      step: 4,
      title: 'Extract Hidden Form Endpoint Safely',
      subtitle: 'Finds the server action destination without firing the click listener',
      explanation:
        'File hosts often hide the real endpoint inside a <form name="F1"> or dynamic javascript object. This snippet extracts the target cleanly.',
      instructions: [
        'Paste the script below into the Console and press Enter.',
        'Copy the target URL that gets printed in the console.'
      ],
      codeSnippet: `(function() {
  const form = document.querySelector('form[name="F1"]') || document.querySelector('form');
  if (form && form.action) {
    console.log("🎯 Real Form Action Endpoint:", form.action);
  } else {
    const link = document.querySelector('a[href*="download"], a[href*="filedl"], a[href*=".rar"]');
    console.log("🔗 Candidate File Link:", link ? link.href : "No direct link found");
  }
})();`
    },
    {
      step: 5,
      title: 'Download with Machine Tools (curl / yt-dlp)',
      subtitle: 'Bypass browser execution with proper Referer spoofing',
      explanation:
        'Once you have the copied media URL, download it via terminal. The host CDN checks the Referer header to verify the request came from the original page.',
      instructions: [
        'Open terminal (Terminal on Mac/Linux or PowerShell on Windows).',
        'Run the curl command with the Referer header set to the host URL.'
      ],
      codeSnippet: `curl -L -o "downloaded_file.rar" \\
  -H "Referer: https://torupload.com/file/3imuvta60y53" \\
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \\
  "<PASTE_COPIED_URL_HERE>"`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <h1 className="text-xl font-bold tracking-tight text-white">
          DevTools Manual Capture & Anti-Hijack Walkthrough
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          How to safely extract media URLs directly from browser DevTools on hostile pages when you cannot run desktop automation.
        </p>
      </div>

      {/* Step by step cards */}
      <div className="space-y-4">
        {STEPS.map((item) => (
          <div
            key={item.step}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-xs shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-cyan-400 font-medium">{item.subtitle}</p>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
              </div>
            </div>

            {/* Instruction list */}
            <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-1.5 text-xs text-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Action Steps:
              </div>
              {item.instructions.map((inst, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{inst}</span>
                </div>
              ))}
            </div>

            {/* Code Snippet if present */}
            {item.codeSnippet && (
              <div className="relative rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-cyan-300">
                <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  <code>{item.codeSnippet}</code>
                </pre>
                <button
                  onClick={() => handleCopy(item.codeSnippet!, `step-${item.step}`)}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedKey === `step-${item.step}` ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* uBlock Origin Filter Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">
            uBlock Origin Advanced Anti-Popunder & Anti-Adblock Defuse Rules
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Add these rules into your uBlock Origin Dashboard → My Filters tab. This forces hostile pages to function without opening 20 new tabs.
        </p>

        <div className="mt-4 relative rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-cyan-300">
          <pre className="overflow-x-auto leading-relaxed">
{`! StreamArmor Universal Anti-Popunder & Anti-Adblock Defuser
||torupload.com^$popup
||torupload.com##+js(nobab)
||torupload.com##+js(acis)
||rapidgator.net^$popup
||uploaded.net^$popup
||katfile.com^$popup
||turbobit.net^$popup`}
          </pre>
          <button
            onClick={() =>
              handleCopy(
                `! StreamArmor Universal Anti-Popunder & Anti-Adblock Defuser\n||torupload.com^$popup\n||torupload.com##+js(nobab)\n||torupload.com##+js(acis)\n||rapidgator.net^$popup\n||uploaded.net^$popup\n||katfile.com^$popup\n||turbobit.net^$popup`,
                'ublock-master'
              )
            }
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:text-white shadow-sm"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copiedKey === 'ublock-master' ? 'Copied Rules!' : 'Copy Filter Rules'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
