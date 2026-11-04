import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Globe,
  DollarSign,
  Ban,
  Layers,
  MousePointerClick,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export const HostileDeconstruction: React.FC = () => {
  const [testClickCount, setTestClickCount] = useState(0);
  const [blockedTabsCount, setBlockedTabsCount] = useState(0);
  const [mode, setMode] = useState<'vulnerable' | 'streamarmor'>('streamarmor');
  const [simulatedSpawns, setSimulatedSpawns] = useState<string[]>([]);

  const handleSimulatedClick = () => {
    setTestClickCount((c) => c + 1);

    if (mode === 'vulnerable') {
      const newSpawns = [
        `ad-network-traffic.click/?cpm=${Math.random().toString(36).substring(7)}`,
        `cleaner-update-alert.ru/installer.exe`,
        `track-affiliate.com/redirect?id=4981`
      ];
      setSimulatedSpawns((prev) => [...newSpawns, ...prev.slice(0, 9)]);
    } else {
      setBlockedTabsCount((c) => c + 3);
      setSimulatedSpawns((prev) => [
        `[BLOCKED BY STREAMARMOR RADAR] popup.close() before window handle creation`,
        ...prev.slice(0, 9)
      ]);
    }
  };

  const MECHANICS = [
    {
      id: 1,
      title: 'The Ad Impression Mill (window.open() Cascades)',
      icon: DollarSign,
      howTheyProfit:
        'Ad networks pay file hosts on a CPM basis (Cost Per Mille). A single click on the host page fires document.body.addEventListener("click") to spawn invisible pop-unders. Even if closed immediately, the impression registers on the ad exchange.',
      howArmorNeutralizes:
        'StreamArmor operates in an isolated headless context or runs curl outside the browser. In Playwright mode, page.on("popup", kill_popup) catches and terminates the window handle before ad tracking telemetry can record a valid impression.'
    },
    {
      id: 2,
      title: 'Affiliate Redirect Hubs (The Fake Download Loop)',
      icon: Globe,
      howTheyProfit:
        'When you click "Create Download Link", scripts route traffic through chains of 4 to 5 affiliate shorteners (adf.ly, shink clones). Each hop generates micropayments while pushing fake browser updates.',
      howArmorNeutralizes:
        'By sniffing HTTP network responses for Content-Disposition: attachment or binary MIME types, StreamArmor grabs the real CDN endpoint and drops secondary browser redirects from memory.'
    },
    {
      id: 3,
      title: 'Malware Distribution Funnels (Pay-Per-Install Wrappers)',
      icon: ShieldAlert,
      howTheyProfit:
        'High-payout PPI networks pay host sites to bundle real files with malicious .exe/.scr installer wrappers, or swap a video archive for an adware setup.exe disguised with a video icon.',
      howArmorNeutralizes:
        'Payload Armor pre-inspects the file extension (.exe, .scr, .apk are hard-blocked) and examines server Content-Type headers before downloading a single byte to disk.'
    },
    {
      id: 4,
      title: 'Data Harvesting & Push Notification Phishing',
      icon: Zap,
      howTheyProfit:
        'Popups trick users into clicking "Allow to verify you are not a robot". This injects persistent ServiceWorker desktop notification spam even when the browser is closed.',
      howArmorNeutralizes:
        'No browser permissions are granted. StreamArmor rejects notification and sensor requests automatically, preventing desktop adware pollution.'
    },
    {
      id: 5,
      title: 'The "Premium" Extortion Friction',
      icon: AlertTriangle,
      howTheyProfit:
        'Free downloads are throttled to 50 KB/s, peppered with broken captchas and 20-tab cascades, creating psychological friction until users break down and purchase a $15/mo "Premium Account".',
      howArmorNeutralizes:
        'StreamArmor automates headless retrieval or copies direct CDN links so you can minimize the app and download in peace via multi-threaded tools like aria2c.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Hostile File Host Deconstruction & Threat Architecture
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Reverse engineering why hostile pages freeze when ad blockers are active and why disabling ad blockers spawns 20+ tabs per click.
        </p>
      </div>

      {/* Interactive Click-Jacking Disarmer Sandbox */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Interactive Document-Wide Click-Jacking Sandbox
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Experience the difference between standard browser vulnerability vs. StreamArmor anti-popup radar.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => {
                setMode('vulnerable');
                setSimulatedSpawns([]);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                mode === 'vulnerable'
                  ? 'bg-rose-500 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vulnerable Browser
            </button>
            <button
              onClick={() => {
                setMode('streamarmor');
                setSimulatedSpawns([]);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                mode === 'streamarmor'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              StreamArmor Protected
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Simulated Webpage Surface */}
          <div
            onClick={handleSimulatedClick}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all select-none ${
              mode === 'vulnerable'
                ? 'border-rose-700/60 bg-rose-950/20 hover:bg-rose-950/30'
                : 'border-cyan-700/60 bg-cyan-950/20 hover:bg-cyan-950/30'
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-white shadow-inner">
              <MousePointerClick className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">
              Simulated Hostile Page Surface
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Click anywhere inside this box (simulates clicking captcha or blank area).
            </p>
            <div className="mt-4 font-mono text-xs text-slate-300">
              Total Clicks: <span className="text-white font-semibold tabular-nums">{testClickCount}</span>
              {mode === 'streamarmor' && (
                <>
                  <span className="text-slate-600 mx-2">·</span>
                  Popups Neutralized: <span className="text-cyan-400 font-semibold tabular-nums">{blockedTabsCount}</span>
                </>
              )}
            </div>
          </div>

          {/* Radar Telemetry Feed */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs space-y-2">
            <div className="text-[11px] font-sans text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Simulated Event Stream</span>
              <span className={mode === 'streamarmor' ? 'text-cyan-400' : 'text-rose-400'}>
                {mode === 'streamarmor' ? 'Radar Active' : 'Hijack Armed'}
              </span>
            </div>

            <div className="min-h-[140px] max-h-[160px] overflow-y-auto space-y-1.5 pt-1">
              {simulatedSpawns.length === 0 ? (
                <div className="text-slate-600 italic py-6 text-center">
                  Click the test area on the left to fire events...
                </div>
              ) : (
                simulatedSpawns.map((event, idx) => (
                  <div
                    key={idx}
                    className={`text-[11px] leading-tight ${
                      event.includes('BLOCKED') ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {event}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* The 5 Mechanics Breakdown */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">
          The 5 Monetization Mechanics & How StreamArmor Neutralizes Them
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {MECHANICS.map((mech) => {
            const Icon = mech.icon;
            return (
              <div
                key={mech.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-sm font-bold text-white">
                      {mech.id}. {mech.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                        <div className="font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>The Attack Vector:</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{mech.howTheyProfit}</p>
                      </div>

                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                        <div className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>StreamArmor Resolution:</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{mech.howArmorNeutralizes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
