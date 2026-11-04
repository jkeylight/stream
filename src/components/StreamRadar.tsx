import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Download,
  Copy,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileVideo,
  FileArchive,
  Ban,
  CheckCircle2,
  FileQuestion,
  RefreshCw,
  Info
} from 'lucide-react';
import { ProbeResult, GeneratedCommands } from '../types';

interface StreamRadarProps {
  onTriggerDownload: (url: string, filename: string, referer?: string) => void;
  onOpenChecklist: () => void;
  presetTargetUrl?: string;
}

const PRESETS = [
  {
    name: 'Direct MP4 Stream',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    desc: 'Clean direct video CDN stream'
  },
  {
    name: 'Clean RAR Archive',
    url: 'https://raw.githubusercontent.com/test-files/sample/main/clean_archive_sample.rar',
    desc: 'Multi-video compressed archive'
  },
  {
    name: 'TorUpload Hostile Page',
    url: 'https://torupload.com/file/3imuvta60y53',
    desc: 'Anti-adblock & click-jacking host page'
  },
  {
    name: 'TorUpload 403 Token Link',
    url: 'https://torupload.com/filedl/3imuvta60y53#115.98.233.70-3imuvta60y53',
    desc: 'Referer / session-gated download URL'
  },
  {
    name: 'Malicious .EXE Lure (Blocked)',
    url: 'https://malvertising-cdn.example/setup_codec_installer.exe',
    desc: 'Tests Payload Armor automatic blocker'
  }
];

export const StreamRadar: React.FC<StreamRadarProps> = ({
  onTriggerDownload,
  onOpenChecklist,
  presetTargetUrl
}) => {
  const [url, setUrl] = useState(presetTargetUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [referer, setReferer] = useState('');
  const [cookies, setCookies] = useState('');
  const [userAgent, setUserAgent] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [commands, setCommands] = useState<GeneratedCommands | null>(null);
  const [activeCommandTab, setActiveCommandTab] = useState<'ytdlp' | 'curl' | 'wget' | 'aria2c' | 'ublock'>('ytdlp');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleProbe = async (targetUrlToProbe?: string) => {
    const target = (targetUrlToProbe || url).trim();
    if (!target) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setCommands(null);

    try {
      const probeRes = await fetch('/api/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: target,
          referer: referer.trim() || undefined,
          cookies: cookies.trim() || undefined,
          userAgent: userAgent.trim() || undefined
        })
      });

      const probeData = await probeRes.json();
      if (!probeRes.ok) {
        throw new Error(probeData.error || 'Probe failed');
      }

      setResult(probeData);

      // Generate commands
      const toolRes = await fetch('/api/generate-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: probeData.finalUrl || target,
          referer: referer.trim() || undefined,
          cookies: cookies.trim() || undefined,
          userAgent: userAgent.trim() || undefined
        })
      });

      if (toolRes.ok) {
        const toolData = await toolRes.json();
        setCommands(toolData);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to inspect link.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'clean_media':
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <FileVideo className="h-4 w-4" />
            <span>Clean Media Stream</span>
          </div>
        );
      case 'clean_archive':
        return (
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs tracking-wider uppercase">
            <FileArchive className="h-4 w-4" />
            <span>Clean Compressed Archive</span>
          </div>
        );
      case 'malicious_executable':
        return (
          <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs tracking-wider uppercase">
            <Ban className="h-4 w-4" />
            <span>Malicious Executable Blocked</span>
          </div>
        );
      case 'gated_page':
        return (
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs tracking-wider uppercase">
            <AlertTriangle className="h-4 w-4" />
            <span>Gated HTML / Script Page</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-xs tracking-wider uppercase">
            <FileQuestion className="h-4 w-4" />
            <span>Unverified Resource</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Anti-Hijack Stream Radar & Payload Armor
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Inspect file-hosting URLs server-side. Zero client JavaScript execution, no popup cascades, and instant detection of disguised .exe payloads.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenChecklist}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span>Security Checklist</span>
            </button>
          </div>
        </div>

        {/* URL Input Form */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste video stream URL, file-host page, or .rar link..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
            <button
              onClick={() => handleProbe()}
              disabled={loading || !url.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-400 disabled:opacity-50 disabled:pointer-events-none active:scale-95 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Probing...</span>
                </>
              ) : (
                <>
                  <Terminal className="h-4 w-4" />
                  <span>Safe Probe (No JS)</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="font-medium text-slate-500">Presets:</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setUrl(preset.url);
                  handleProbe(preset.url);
                }}
                className="rounded-md border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white font-mono"
                title={preset.desc}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Collapsible Advanced Headers Drawer */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>Custom HTTP Headers (Referer, Cookies, User-Agent)</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-slate-800 bg-slate-950/80 p-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    HTTP Referer Header:
                  </label>
                  <input
                    type="text"
                    value={referer}
                    onChange={(e) => setReferer(e.target.value)}
                    placeholder="Auto-derived from target origin"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Session Cookies (optional):
                  </label>
                  <input
                    type="text"
                    value={cookies}
                    onChange={(e) => setCookies(e.target.value)}
                    placeholder="session_id=...; auth=..."
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    User-Agent Override:
                  </label>
                  <input
                    type="text"
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    placeholder="Default: Chrome 124 Windows"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message Display */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 text-sm text-rose-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-200">Probe Request Failed</div>
            <div className="mt-1 text-xs text-rose-300/90">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-cyan-400 animate-spin" />
          <h3 className="mt-3 text-sm font-semibold text-white">Inspecting Stream Pipeline</h3>
          <p className="mt-1 text-xs text-slate-400">
            Dispatching non-browser HEAD/GET probe. Bypassing client-side JavaScript and pop-under listeners...
          </p>
        </div>
      )}

      {/* Probe Result Viewport */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Main Inspection Banner */}
          <div
            className={`rounded-xl border p-6 backdrop-blur-sm transition-all ${
              !result.payloadArmor.isSafe
                ? 'border-rose-700/80 bg-rose-950/30'
                : result.payloadArmor.category === 'clean_media'
                ? 'border-emerald-700/70 bg-emerald-950/20'
                : result.payloadArmor.category === 'clean_archive'
                ? 'border-sky-700/70 bg-sky-950/20'
                : 'border-amber-700/70 bg-amber-950/20'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {getCategoryBadge(result.payloadArmor.category)}
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-xs text-slate-300 tabular-nums">
                    HTTP {result.status} {result.statusText}
                  </span>
                  {result.redirectCount > 0 && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-cyan-400">Redirect Followed</span>
                    </>
                  )}
                </div>

                <h2 className="text-lg font-bold text-white break-all">
                  {result.filename}
                </h2>

                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  {result.diagnosis}
                </p>
              </div>

              {/* Status Action Block */}
              <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                {result.payloadArmor.isSafe && (
                  <button
                    onClick={() => onTriggerDownload(result.finalUrl, result.filename, referer)}
                    className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-cyan-400 active:scale-95 whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download via Stream Proxy</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopy(result.finalUrl, 'direct-url')}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedKey === 'direct-url' ? 'Copied URL!' : 'Copy Direct Link'}</span>
                </button>
              </div>
            </div>

            {/* Metric Strips */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4">
              <div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">File Size</div>
                <div className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                  {result.formattedSize}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Content-Type</div>
                <div className="mt-1 font-mono text-xs text-slate-200 truncate" title={result.headers['content-type']}>
                  {result.headers['content-type'] || 'application/octet-stream'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Armor Verdict</div>
                <div className="mt-1 text-xs font-medium">
                  {result.payloadArmor.isSafe ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified Non-Executable
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" /> Blocked Executable Lure
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Remote Server</div>
                <div className="mt-1 font-mono text-xs text-slate-300 truncate" title={result.headers['server']}>
                  {result.headers['server'] || 'Standard CDN Endpoint'}
                </div>
              </div>
            </div>

            {/* Threat Detail Alert if blocked */}
            {!result.payloadArmor.isSafe && (
              <div className="mt-4 rounded-lg border border-rose-800/80 bg-rose-950/60 p-3.5 text-xs text-rose-200">
                <div className="font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span>PAYLOAD SHIELD INTERVENTION</span>
                </div>
                <p className="mt-1 text-rose-300">
                  {result.payloadArmor.threatReason}
                </p>
                <p className="mt-1 font-semibold text-rose-100">
                  Recommendation: {result.payloadArmor.recommendedAction}
                </p>
              </div>
            )}
          </div>

          {/* Generated CLI Commands & Filter Rules */}
          {commands && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Generated Clean Terminal Commands & Anti-Hijack Rules
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bypasses all page scripts, pop-unders, and ad networks using native command-line stream handlers.
                  </p>
                </div>

                {/* Tab selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setActiveCommandTab('ytdlp')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeCommandTab === 'ytdlp' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    yt-dlp
                  </button>
                  <button
                    onClick={() => setActiveCommandTab('curl')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeCommandTab === 'curl' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    curl
                  </button>
                  <button
                    onClick={() => setActiveCommandTab('wget')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeCommandTab === 'wget' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    wget
                  </button>
                  <button
                    onClick={() => setActiveCommandTab('aria2c')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeCommandTab === 'aria2c' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    aria2c
                  </button>
                  <button
                    onClick={() => setActiveCommandTab('ublock')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeCommandTab === 'ublock' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    uBlock Rules
                  </button>
                </div>
              </div>

              {/* Active command display */}
              <div className="mt-4 relative">
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {activeCommandTab === 'ytdlp' && commands.ytdlp}
                  {activeCommandTab === 'curl' && commands.curl}
                  {activeCommandTab === 'wget' && commands.wget}
                  {activeCommandTab === 'aria2c' && commands.aria2c}
                  {activeCommandTab === 'ublock' && commands.ublock}
                </div>

                <button
                  onClick={() => {
                    const text =
                      activeCommandTab === 'ytdlp'
                        ? commands.ytdlp
                        : activeCommandTab === 'curl'
                        ? commands.curl
                        : activeCommandTab === 'wget'
                        ? commands.wget
                        : activeCommandTab === 'aria2c'
                        ? commands.aria2c
                        : commands.ublock;
                    handleCopy(text, `cmd-${activeCommandTab}`);
                  }}
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded bg-slate-800/90 border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedKey === `cmd-${activeCommandTab}` ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>
                  {activeCommandTab === 'ytdlp' && 'yt-dlp parses stream servers directly without executing hostile in-page advertisements.'}
                  {activeCommandTab === 'curl' && 'curl spoofing natural Referer bypasses 403 anti-leech filters.'}
                  {activeCommandTab === 'wget' && 'wget fetches without spawning external windows or browser handles.'}
                  {activeCommandTab === 'aria2c' && 'aria2c uses 8 multi-threaded connections to maximize bandwidth on throttled hosts.'}
                  {activeCommandTab === 'ublock' && 'Paste into uBlock Origin dashboard -> My Filters to freeze torupload popups and nobab anti-adblock detection.'}
                </span>
              </div>
            </div>
          )}

          {/* Raw Response Headers Accordion */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between list-none">
                <span>View Raw Server Response Headers ({Object.keys(result.headers).length} fields)</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-slate-400" />
              </summary>
              <div className="mt-3 border-t border-slate-800 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
                  {Object.entries(result.headers).map(([key, val]) => (
                    <div key={key} className="flex gap-2 rounded bg-slate-950/80 px-2.5 py-1.5 border border-slate-800/60 truncate">
                      <span className="text-cyan-400 shrink-0">{key}:</span>
                      <span className="text-slate-300 truncate" title={val}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};
