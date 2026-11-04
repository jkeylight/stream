import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Play,
  Terminal,
  CheckCircle2,
  RefreshCw,
  FolderArchive,
  Cpu,
  Layers,
  ShieldCheck,
  Package
} from 'lucide-react';
import { ScriptFile } from '../types';

export const ScriptHub: React.FC = () => {
  const [scripts, setScripts] = useState<ScriptFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>('app.py');
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test execution state
  const [runningTest, setRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/scripts')
      .then((res) => res.json())
      .then((data) => {
        setScripts(data);
        if (data.length > 0 && !activeFile) {
          setActiveFile(data[0].name);
        }
      })
      .catch((err) => console.error('Error fetching scripts:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadSingle = (file: ScriptFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const runLiveTest = async () => {
    setRunningTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/run-test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        stdout: '',
        stderr: err.message || 'Execution error',
        exitCode: 1,
        timestamp: new Date().toISOString()
      });
    } finally {
      setRunningTest(false);
    }
  };

  const currentScript = scripts.find((s) => s.name === activeFile);

  return (
    <div className="space-y-6">
      {/* Header and Download Bundle Actions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>StreamArmor Python Toolkit & Standalone .EXE Suite</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              The complete Python script collection: Background Clipboard Watcher, Playwright anti-popup sandbox, CLI downloader, and PyInstaller spec.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={runLiveTest}
              disabled={runningTest}
              className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {runningTest ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Running Test Suite...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Execute test_basic.py</span>
                </>
              )}
            </button>

            <a
              href="/api/download-bundle"
              download="streamarmor-python-toolkit.zip"
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-all shadow-sm whitespace-nowrap active:scale-95"
            >
              <Package className="h-3.5 w-3.5" />
              <span>Download Suite (.ZIP)</span>
            </a>
          </div>
        </div>

        {/* Live Test Results Console */}
        {testResult && (
          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] font-sans">
              <span className="text-slate-400">
                Server Execution Result (Exit Code: {testResult.exitCode})
              </span>
              <span className={testResult.success ? 'text-emerald-400 font-semibold flex items-center gap-1' : 'text-rose-400 font-semibold'}>
                {testResult.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {testResult.success ? 'All 4 Test Cases Passed' : 'Test Failures Encountered'}
              </span>
            </div>
            <pre className="mt-3 overflow-x-auto text-cyan-300 whitespace-pre-wrap leading-relaxed">
              {testResult.stdout}
              {testResult.stderr && <span className="text-rose-400">{testResult.stderr}</span>}
            </pre>
          </div>
        )}
      </div>

      {/* Script Explorer & Code Viewer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        {/* File Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/80 px-4 pt-3 gap-2">
          {scripts.map((file) => (
            <button
              key={file.name}
              onClick={() => setActiveFile(file.name)}
              className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-mono transition-colors whitespace-nowrap ${
                activeFile === file.name
                  ? 'border-cyan-400 text-cyan-300 font-semibold bg-slate-900/80 rounded-t'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-cyan-400/80" />
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* Current File Header & Action Bar */}
        {currentScript && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-5 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{currentScript.title}</span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                  {currentScript.lines} lines ({Math.round(currentScript.size / 1024 * 10) / 10} KB)
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{currentScript.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(currentScript.content, currentScript.name)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Copy className="h-3 w-3" />
                <span>{copiedKey === currentScript.name ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={() => handleDownloadSingle(currentScript)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>Save File</span>
              </button>
            </div>
          </div>
        )}

        {/* Code Content Container */}
        {currentScript && (
          <div className="relative bg-slate-950 p-5 font-mono text-xs text-slate-300 overflow-x-auto max-h-[540px]">
            <pre className="leading-relaxed">
              <code>{currentScript.content}</code>
            </pre>
          </div>
        )}
      </div>

      {/* PyInstaller Executable Compilation Guide */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Compile to Standalone Windows .EXE with PyInstaller
            </h2>
            <p className="text-xs text-slate-400">
              Bundle app.py into AntiSpamDownloader.exe so it runs on any Windows machine without needing Python pre-installed.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-bold text-cyan-400">Step 1: Install Bundler</div>
            <div className="mt-2 rounded bg-slate-900 p-2 font-mono text-[11px] text-slate-300 select-all">
              pip install pyinstaller playwright pyperclip requests
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-bold text-cyan-400">Step 2: Compile Command</div>
            <div className="mt-2 rounded bg-slate-900 p-2 font-mono text-[11px] text-slate-300 select-all">
              pyinstaller --onefile --name="AntiSpamDownloader" app.py
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-bold text-cyan-400">Step 3: Run Executable</div>
            <div className="mt-2 text-xs text-slate-400">
              Navigate to <code className="text-cyan-300 font-mono">dist/AntiSpamDownloader.exe</code>. Double click to start background clipboard radar!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
