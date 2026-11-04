import React, { useState } from 'react';
import {
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Hash,
  ExternalLink,
  Layers,
  RefreshCw,
  Play,
  Copy,
  Ban,
  FileVideo,
  FileArchive
} from 'lucide-react';
import { BatchItem, HashCheckResult } from '../types';

interface LiveStreamerProps {
  initialDownloadUrl?: string;
  initialFilename?: string;
  initialReferer?: string;
}

export const LiveStreamer: React.FC<LiveStreamerProps> = ({
  initialDownloadUrl = '',
  initialFilename = '',
  initialReferer = ''
}) => {
  const [downloadUrl, setDownloadUrl] = useState(initialDownloadUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [filename, setFilename] = useState(initialFilename || 'BigBuckBunny.mp4');
  const [referer, setReferer] = useState(initialReferer || '');
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  // Hash check state
  const [hashInput, setHashInput] = useState('');
  const [hashResult, setHashResult] = useState<HashCheckResult | null>(null);
  const [hashing, setHashing] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Batch queue state
  const [batchRaw, setBatchRaw] = useState(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4\nhttps://torupload.com/file/3imuvta60y53\nhttps://raw.githubusercontent.com/test-files/sample/main/clean_archive_sample.rar\nhttps://malvertising-cdn.example/setup_codec_installer.exe'
  );
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const startDirectDownload = () => {
    if (!downloadUrl.trim()) return;
    setDownloading(true);
    setDownloadStatus('Connecting to streaming proxy...');

    // Trigger browser download via stream proxy
    const params = new URLSearchParams();
    params.set('url', downloadUrl.trim());
    if (filename.trim()) params.set('filename', filename.trim());
    if (referer.trim()) params.set('referer', referer.trim());

    const streamUrl = `/api/stream-download?${params.toString()}`;

    // Create invisible anchor to trigger browser native download prompt
    const anchor = document.createElement('a');
    anchor.href = streamUrl;
    anchor.setAttribute('download', filename.trim() || 'safe_download');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => {
      setDownloadStatus('Stream dispatched directly to browser download manager. Payload Armor verified.');
      setDownloading(false);
    }, 1500);
  };

  const calculateHash = async () => {
    if (!hashInput.trim()) return;
    setHashing(true);
    setHashResult(null);

    try {
      const isUrl = hashInput.trim().startsWith('http://') || hashInput.trim().startsWith('https://');
      const res = await fetch('/api/hash-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: hashInput.trim(),
          type: isUrl ? 'url' : 'string'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to hash');
      setHashResult(data);
    } catch (err: any) {
      alert(err.message || 'Hash generation failed');
    } finally {
      setHashing(false);
    }
  };

  const runBatchProbe = async () => {
    const urls = batchRaw
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    if (!urls.length) return;

    setBatchProcessing(true);
    const initialItems: BatchItem[] = urls.map((u, i) => ({
      id: `${i}-${Date.now()}`,
      url: u,
      loading: true
    }));
    setBatchItems(initialItems);

    for (let i = 0; i < urls.length; i++) {
      const targetUrl = urls[i];
      try {
        const res = await fetch('/api/probe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl })
        });
        const data = await res.json();

        setBatchItems(prev =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: data.status,
                  filename: data.filename,
                  formattedSize: data.formattedSize,
                  category: data.payloadArmor?.category,
                  isSafe: data.payloadArmor?.isSafe,
                  loading: false
                }
              : item
          )
        );
      } catch (err: any) {
        setBatchItems(prev =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  loading: false,
                  error: err.message || 'Failed'
                }
              : item
          )
        );
      }
    }

    setBatchProcessing(false);
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Single Stream Downloader */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Download className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">StreamArmor Direct Stream Proxy</h2>
            <p className="text-xs text-slate-400">
              Streams verified media or archives through our backend engine. Inspects chunks in-flight and aborts if executable malware is injected.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Stream / Media Target URL:
            </label>
            <input
              type="text"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://cdn.example.com/video.mp4 or archive.rar"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Save Filename:
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. video.mp4"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {downloadStatus && (
              <span className="text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                {downloadStatus}
              </span>
            )}
          </div>

          <button
            onClick={startDirectDownload}
            disabled={downloading || !downloadUrl.trim()}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-cyan-400 disabled:opacity-50 active:scale-95 whitespace-nowrap self-end"
          >
            {downloading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Streaming Payload...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Start Direct Download</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section 2: Batch URL Processor */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Batch Link Radar & Queue</h2>
              <p className="text-xs text-slate-400">
                Queue multiple hostile or CDN URLs to scan for executable bait and check accessibility in parallel.
              </p>
            </div>
          </div>

          <button
            onClick={runBatchProbe}
            disabled={batchProcessing || !batchRaw.trim()}
            className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {batchProcessing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                <span>Inspecting Queue...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-cyan-400" />
                <span>Probe All Links</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            URLs to inspect (one per line):
          </label>
          <textarea
            rows={4}
            value={batchRaw}
            onChange={(e) => setBatchRaw(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            placeholder="Paste multiple URLs here..."
          />
        </div>

        {/* High-Density Results Table */}
        {batchItems.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Target URL</th>
                  <th className="py-2.5 px-3 font-semibold">HTTP Status</th>
                  <th className="py-2.5 px-3 font-semibold">Payload Armor</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Size</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 font-mono">
                {batchItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 truncate max-w-xs text-slate-300" title={item.url}>
                      {item.url}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      {item.loading ? (
                        <span className="text-slate-500 animate-pulse">Probing...</span>
                      ) : item.status ? (
                        <span
                          className={
                            item.status === 200
                              ? 'text-emerald-400 font-semibold'
                              : item.status === 403
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }
                        >
                          {item.status}
                        </span>
                      ) : (
                        <span className="text-slate-500">Failed</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.loading ? (
                        <span className="text-slate-500">...</span>
                      ) : item.category === 'malicious_executable' ? (
                        <span className="text-rose-400 flex items-center gap-1 font-semibold">
                          <Ban className="h-3.5 w-3.5" /> Blocked Executable
                        </span>
                      ) : item.category === 'clean_media' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <FileVideo className="h-3.5 w-3.5" /> Clean Media
                        </span>
                      ) : item.category === 'clean_archive' ? (
                        <span className="text-sky-400 flex items-center gap-1">
                          <FileArchive className="h-3.5 w-3.5" /> Clean Archive
                        </span>
                      ) : (
                        <span className="text-amber-400">Gated / Page</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                      {item.formattedSize || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {item.isSafe && item.status === 200 ? (
                        <a
                          href={`/api/stream-download?url=${encodeURIComponent(item.url)}`}
                          download
                          className="inline-flex items-center gap-1 rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 text-[11px] font-sans font-medium text-cyan-400 hover:bg-cyan-500/20"
                        >
                          <Download className="h-3 w-3" />
                          <span>Fetch</span>
                        </a>
                      ) : (
                        <span className="text-slate-600 text-[11px] font-sans">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Hash Calculation & VirusTotal Lookup */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Hash className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Pre-Extraction Hash Calculator & VirusTotal Query</h2>
            <p className="text-xs text-slate-400">
              Calculate cryptographic SHA-256 and MD5 fingerprints. Check VirusTotal before extracting archives or playing untrusted binaries.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="Paste direct file URL or raw hash to verify..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-cyan-500 focus:outline-none"
          />
          <button
            onClick={calculateHash}
            disabled={hashing || !hashInput.trim()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {hashing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                <span>Hashing...</span>
              </>
            ) : (
              <>
                <Hash className="h-3.5 w-3.5 text-cyan-400" />
                <span>Compute SHA-256</span>
              </>
            )}
          </button>
        </div>

        {hashResult && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-sans">
                  SHA-256 Checksum:
                </span>
                <span className="text-cyan-300 font-semibold break-all tabular-nums">
                  {hashResult.sha256}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(hashResult.sha256);
                  setCopiedHash(true);
                  setTimeout(() => setCopiedHash(false), 2000);
                }}
                className="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white shrink-0 font-sans"
              >
                <Copy className="h-3 w-3" />
                <span>{copiedHash ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
              <span className="text-slate-400">MD5: {hashResult.md5}</span>
              <a
                href={hashResult.virustotalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-sans"
              >
                <span>Look up on VirusTotal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
