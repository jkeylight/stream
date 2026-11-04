import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// List of dangerous executable extensions
const MALICIOUS_EXTENSIONS = new Set([
  '.exe', '.msi', '.bat', '.cmd', '.scr', '.vbs', '.apk', '.js', '.wsf', '.hta', '.pif', '.com', '.reg'
]);

// Clean media extensions
const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.avi', '.webm', '.mov', '.flv', '.ts', '.m3u8', '.mpd', '.mp3', '.aac', '.wav', '.flac'
]);

// Clean archive extensions
const ARCHIVE_EXTENSIONS = new Set([
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso'
]);

// Helper: parse filename from Content-Disposition or URL
function extractFilename(urlStr: string, disposition?: string | null): string {
  if (disposition) {
    const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    if (filenameMatch && filenameMatch[1]) {
      return decodeURIComponent(filenameMatch[1].trim());
    }
  }
  try {
    const parsed = new URL(urlStr);
    const pathname = parsed.pathname;
    const base = pathname.split('/').filter(Boolean).pop();
    if (base && base.includes('.')) {
      return decodeURIComponent(base.split('?')[0]);
    }
  } catch {
    // fallback
  }
  return 'downloaded_asset.rar';
}

// Helper: payload armor analyzer
function evaluatePayloadArmor(filename: string, contentType: string, url: string) {
  const cleanExt = '.' + (filename.split('.').pop() || '').toLowerCase();
  const lowerUrl = url.toLowerCase().split('?')[0];
  const lowerMime = (contentType || '').toLowerCase();

  const isExecutableExt = MALICIOUS_EXTENSIONS.has(cleanExt) ||
    Array.from(MALICIOUS_EXTENSIONS).some(ext => lowerUrl.endsWith(ext));

  const dangerousMimes = [
    'application/x-msdownload',
    'application/x-executable',
    'application/vnd.android.package-archive',
    'application/x-msdos-program',
    'application/x-sh',
    'application/x-csh'
  ];

  const isDangerousMime = dangerousMimes.some(mime => lowerMime.includes(mime));

  if (isExecutableExt || isDangerousMime) {
    return {
      category: 'malicious_executable',
      isSafe: false,
      threatScore: 'CRITICAL',
      threatReason: `Dangerous executable wrapper detected (${cleanExt || lowerMime}). Hostile sites disguise installers or spyware to execute malware.`,
      recommendedAction: 'ABORT IMMEDIATELY. Do not run or save this file outside an isolated sandbox.'
    };
  }

  if (MEDIA_EXTENSIONS.has(cleanExt) || lowerMime.startsWith('video/') || lowerMime.startsWith('audio/')) {
    return {
      category: 'clean_media',
      isSafe: true,
      threatScore: 'CLEAN',
      threatReason: 'Target is a legitimate media stream (.mp4/.mkv/audio). No executable binaries detected.',
      recommendedAction: 'Safe to download directly or play via streaming proxy.'
    };
  }

  if (ARCHIVE_EXTENSIONS.has(cleanExt) || lowerMime.includes('zip') || lowerMime.includes('rar') || lowerMime.includes('tar') || lowerMime.includes('7z')) {
    return {
      category: 'clean_archive',
      isSafe: true,
      threatScore: 'NEEDS_SANDBOX_SCAN',
      threatReason: 'Target is a compressed archive (.rar/.zip). While safe from immediate script execution, verify inside Windows Sandbox before extracting.',
      recommendedAction: 'Safe to fetch. Follow the 4-step Pre-Extraction Checklist.'
    };
  }

  if (lowerMime.includes('text/html')) {
    return {
      category: 'gated_page',
      isSafe: true,
      threatScore: 'HTML_PAGE',
      threatReason: 'Response is an HTML landing page rather than a raw binary stream. It may contain ad scripts or captcha gates.',
      recommendedAction: 'Inspect Network tab in DevTools or disable JavaScript to capture direct media/CDN URL.'
    };
  }

  return {
    category: 'unknown_document',
    isSafe: true,
    threatScore: 'UNVERIFIED',
    threatReason: `Content type (${lowerMime || 'unknown'}) is not explicitly executable, but format is unverified.`,
    recommendedAction: 'Proceed with caution. Scan file with VirusTotal before opening.'
  };
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// POST /api/probe: Safe server-side link inspection
app.post('/api/probe', async (req: Request, res: Response) => {
  const { url, referer, userAgent, cookies } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Target URL is required.' });
  }

  const cleanUrl = url.trim();
  try {
    new URL(cleanUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format provided.' });
  }

  // Pre-check for known malicious extension
  const urlPath = cleanUrl.split('?')[0].toLowerCase();
  for (const ext of MALICIOUS_EXTENSIONS) {
    if (urlPath.endsWith(ext)) {
      return res.json({
        url: cleanUrl,
        finalUrl: cleanUrl,
        status: 403,
        statusText: 'BLOCKED BY STREAMARMOR PAYLOAD SHIELD',
        headers: { 'content-type': 'application/x-msdownload' },
        filename: path.basename(urlPath),
        fileSize: 0,
        formattedSize: 'Unknown',
        payloadArmor: {
          category: 'malicious_executable',
          isSafe: false,
          threatScore: 'CRITICAL',
          threatReason: `URL directly points to executable payload (${ext}). StreamArmor prevented remote request.`,
          recommendedAction: 'DO NOT DOWNLOAD. This is a malvertising wrapper.'
        },
        diagnosis: 'Blocked in flight: Dangerous executable lure detected prior to network dispatch.',
        redirectCount: 0
      });
    }
  }

  const defaultUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  const defaultReferer = referer || cleanUrl.split('#')[0].split('?')[0];

  const headers: Record<string, string> = {
    'User-Agent': userAgent || defaultUserAgent,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': defaultReferer
  };

  if (cookies) {
    headers['Cookie'] = cookies;
  }

  try {
    // Perform fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // Try HEAD first to avoid downloading large binary
    let response: any;
    let methodUsed = 'HEAD';

    try {
      response = await fetch(cleanUrl, {
        method: 'HEAD',
        headers,
        redirect: 'follow',
        signal: controller.signal
      });
    } catch {
      // Some hostile file hosts reject HEAD requests with 405 or 403. Fallback to GET with Range 0-1024
      controller.abort();
    }

    if (!response || !response.ok && (response.status === 405 || response.status === 403 || response.status === 501)) {
      methodUsed = 'GET';
      const getController = new AbortController();
      const getTimeout = setTimeout(() => getController.abort(), 12000);
      try {
        response = await fetch(cleanUrl, {
          method: 'GET',
          headers: { ...headers, 'Range': 'bytes=0-2048' },
          redirect: 'follow',
          signal: getController.signal
        });
        clearTimeout(getTimeout);
      } catch (err: any) {
        clearTimeout(getTimeout);
        return res.json({
          url: cleanUrl,
          finalUrl: cleanUrl,
          status: 0,
          statusText: 'Connection Failed / Timed Out',
          headers: {},
          filename: extractFilename(cleanUrl),
          fileSize: 0,
          formattedSize: '0 B',
          payloadArmor: {
            category: 'gated_page',
            isSafe: true,
            threatScore: 'NETWORK_TIMEOUT',
            threatReason: `Connection timed out or network blocked: ${err?.message || 'Remote server unreachable'}`,
            recommendedAction: 'Check proxy settings or verify host domain availability.'
          },
          diagnosis: 'The target host did not respond within 12 seconds. Host may be offline or IP-gating traffic.',
          redirectCount: 0
        });
      }
    } else {
      clearTimeout(timeoutId);
    }

    const respHeaders: Record<string, string> = {};
    response.headers.forEach((val: string, key: string) => {
      respHeaders[key.toLowerCase()] = val;
    });

    const contentType = respHeaders['content-type'] || 'application/octet-stream';
    const contentLength = Number(respHeaders['content-length']) || 0;
    const contentDisposition = respHeaders['content-disposition'] || '';
    const finalUrl = response.url || cleanUrl;

    const filename = extractFilename(finalUrl, contentDisposition);
    const armor = evaluatePayloadArmor(filename, contentType, finalUrl);

    // Format file size
    let formattedSize = 'Unknown';
    if (contentLength > 0) {
      if (contentLength >= 1024 * 1024 * 1024) {
        formattedSize = `${(contentLength / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      } else if (contentLength >= 1024 * 1024) {
        formattedSize = `${(contentLength / (1024 * 1024)).toFixed(2)} MB`;
      } else if (contentLength >= 1024) {
        formattedSize = `${(contentLength / 1024).toFixed(1)} KB`;
      } else {
        formattedSize = `${contentLength} B`;
      }
    }

    // Diagnosis based on status code
    let diagnosis = 'Direct media or file stream reachable.';
    if (response.status === 403) {
      diagnosis = 'HTTP 403 Forbidden: Server rejected the probe. The download link is likely token-locked, Referer-locked, or IP-session bound. Follow Step 1 in DevTools Guide to capture with current browser session cookies.';
    } else if (response.status === 407) {
      diagnosis = 'HTTP 407 Proxy Authentication Required: The request was intercepted by a network proxy requiring credentials. Disable VPN/proxy or configure credentials.';
    } else if (response.status === 302 || response.status === 301) {
      diagnosis = `Redirected to: ${finalUrl}. Direct CDN link resolved.`;
    } else if (response.status === 200 && armor.category === 'gated_page') {
      diagnosis = 'Landing page returned (HTML). The file stream is behind a button or CAPTCHA. Use DevTools Network filter to extract the underlying media request or form action.';
    } else if (response.status === 200 && armor.isSafe) {
      diagnosis = `Stream Ready: ${filename} (${formattedSize}). Server confirmed binary payload without executing client JavaScript.`;
    }

    return res.json({
      url: cleanUrl,
      finalUrl,
      status: response.status,
      statusText: response.statusText,
      methodUsed,
      headers: respHeaders,
      filename,
      fileSize: contentLength,
      formattedSize,
      payloadArmor: armor,
      diagnosis,
      redirectCount: finalUrl !== cleanUrl ? 1 : 0
    });
  } catch (error: any) {
    return res.status(500).json({
      error: `Probe execution failed: ${error?.message || 'Unknown error'}`
    });
  }
});

// GET /api/stream-download: Server-side clean streaming proxy
app.get('/api/stream-download', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  const referer = req.query.referer as string;
  const requestedName = req.query.filename as string;

  if (!targetUrl) {
    return res.status(400).send('Target URL parameter is required.');
  }

  // Pre-check for malicious extensions
  const cleanExt = '.' + (targetUrl.split('?')[0].split('.').pop() || '').toLowerCase();
  if (MALICIOUS_EXTENSIONS.has(cleanExt)) {
    return res.status(403).send('StreamArmor Alert: Blocked download of dangerous executable extension (.exe, .scr, etc.).');
  }

  const defaultReferer = referer || targetUrl.split('#')[0].split('?')[0];
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  try {
    const upstreamResp = await fetch(targetUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': defaultReferer,
        'Accept': '*/*'
      }
    });

    if (!upstreamResp.ok) {
      return res.status(upstreamResp.status).send(`Upstream server returned HTTP ${upstreamResp.status}: ${upstreamResp.statusText}`);
    }

    const contentType = upstreamResp.headers.get('content-type') || 'application/octet-stream';
    const disposition = upstreamResp.headers.get('content-disposition');
    const finalFilename = requestedName || extractFilename(targetUrl, disposition);

    // Deep check MIME type for malware
    const armor = evaluatePayloadArmor(finalFilename, contentType, targetUrl);
    if (!armor.isSafe) {
      return res.status(403).send(`StreamArmor Alert: Server returned prohibited executable MIME type (${contentType}). Aborting.`);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    res.setHeader('Content-Type', contentType);

    const contentLength = upstreamResp.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    if (!upstreamResp.body) {
      return res.status(500).send('No response body returned from upstream stream.');
    }

    // Stream chunks through express response
    const reader = upstreamResp.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          break;
        }
        res.write(value);
      }
    };

    await pump();
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).send(`Streaming proxy error: ${error?.message || 'Unknown error'}`);
    } else {
      res.end();
    }
  }
});

// POST /api/generate-tools: Generate commands for yt-dlp, curl, wget, aria2c, uBlock
app.post('/api/generate-tools', (req: Request, res: Response) => {
  const { url, referer, cookies, userAgent } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  const cleanUrl = url.trim();
  const defaultReferer = referer || cleanUrl.split('#')[0].split('?')[0];
  const defaultUa = userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  let domain = 'example.com';
  try {
    domain = new URL(cleanUrl).hostname;
  } catch {
    // fallback
  }

  const filename = extractFilename(cleanUrl);

  const cookieHeader = cookies ? `-H "Cookie: ${cookies}" ` : '';
  const cookieParamWget = cookies ? `--header="Cookie: ${cookies}" ` : '';

  const curlCmd = `curl -L --fail -o "${filename}" \\\n  -H "Referer: ${defaultReferer}" \\\n  -H "User-Agent: ${defaultUa}" \\\n  ${cookieHeader}"${cleanUrl}"`;

  const wgetCmd = `wget --referer="${defaultReferer}" \\\n     --user-agent="${defaultUa}" \\\n     ${cookieParamWget}-O "${filename}" "${cleanUrl}"`;

  const ytdlpCmd = `yt-dlp --no-proxy \\\n       --referer "${defaultReferer}" \\\n       --user-agent "${defaultUa}" \\\n       "${cleanUrl}"`;

  const aria2cCmd = `aria2c -x 8 -s 8 \\\n       --header="Referer: ${defaultReferer}" \\\n       --header="User-Agent: ${defaultUa}" \\\n       -o "${filename}" "${cleanUrl}"`;

  const powershellCmd = `$headers = @{\n  "Referer" = "${defaultReferer}"\n  "User-Agent" = "${defaultUa}"\n}\nInvoke-WebRequest -Uri "${cleanUrl}" -Headers $headers -OutFile "${filename}"`;

  const ublockRules = `! StreamArmor Anti-Hijack Rules for ${domain}\n||${domain}^$popup\n||${domain}##+js(nobab)\n||${domain}##+js(acis)\n||${domain}##[id*="ad-"]\n||${domain}##[class*="popup"]`;

  const devtoolsConsoleSnippet = `// StreamArmor: Safe form and direct link extractor\n// Unlocks Chrome DevTools paste & extracts download target without clicking\n(function() {\n  const form = document.querySelector('form[name="F1"]') || document.querySelector('form');\n  const links = Array.from(document.querySelectorAll('a[href*="file"], a[href*="download"], a[href*=".rar"], a[href*=".mp4"]'));\n  console.log("=== STREAMARMOR EXTRACTION ===");\n  if (form && form.action) {\n    console.log("🎯 Form Action URL:", form.action);\n  }\n  if (links.length) {\n    console.log("🔗 Candidate Links Found:", links.map(a => a.href));\n  }\n  const mediaReq = window.download_url || window.file_url;\n  if (mediaReq) console.log("📺 Direct Stream Variable:", mediaReq);\n})();`;

  res.json({
    curl: curlCmd,
    wget: wgetCmd,
    ytdlp: ytdlpCmd,
    aria2c: aria2cCmd,
    powershell: powershellCmd,
    ublock: ublockRules,
    devtools: devtoolsConsoleSnippet,
    filename,
    domain
  });
});

// GET /api/scripts: List all Python toolkit files
app.get('/api/scripts', (_req: Request, res: Response) => {
  const toolkitDir = path.join(__dirname, 'python-toolkit');
  const files = [
    { name: 'app.py', title: 'Standalone AntiSpamDownloader (Clipboard & Playwright)', description: 'Background clipboard watcher, Playwright isolated browser, anti-popup radar, and Payload Armor. Compilable to .exe.' },
    { name: 'downloader.py', title: 'SecureDownloader CLI & Python Class', description: 'Core Python module providing SecureDownloader class, CLI flags (--url, --output, --delay, --cookies), and curl fallback.' },
    { name: 'gui.py', title: 'Tkinter Desktop GUI', description: 'Native desktop application with URL input, delay selector, cookies entry, and live log stream.' },
    { name: 'test_basic.py', title: 'Unit Test Suite', description: 'Tests imports, CLI flags, missing URL validation, and Payload Armor executable filtering.' },
    { name: 'requirements.txt', title: 'Python Dependencies', description: 'playwright, requests, pyperclip, beautifulsoup4, pyinstaller.' },
    { name: 'run.bat', title: 'Windows Auto-Launcher', description: 'Batch file to check Python, install requirements, and launch GUI or CLI.' },
    { name: 'README.md', title: 'Technical Documentation', description: 'Complete architecture, threat model, and usage manual.' }
  ];

  const results = files.map(item => {
    const filePath = path.join(toolkitDir, item.name);
    let content = '';
    let size = 0;
    let lines = 0;
    try {
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf-8');
        size = Buffer.byteLength(content, 'utf-8');
        lines = content.split('\n').length;
      }
    } catch {
      // ignore
    }
    return {
      ...item,
      content,
      size,
      lines
    };
  });

  res.json(results);
});

// POST /api/run-test: Execute test_basic.py and return output
app.post('/api/run-test', (_req: Request, res: Response) => {
  const testScript = path.join(__dirname, 'python-toolkit', 'test_basic.py');
  exec(`python3 "${testScript}"`, { timeout: 10000 }, (error, stdout, stderr) => {
    res.json({
      success: !error && error === null,
      exitCode: error ? error.code : 0,
      stdout: stdout || '',
      stderr: stderr || '',
      timestamp: new Date().toISOString()
    });
  });
});

// GET /api/download-bundle: Creates and streams a ZIP of the python-toolkit folder
app.get('/api/download-bundle', (_req: Request, res: Response) => {
  const toolkitDir = path.join(__dirname, 'python-toolkit');
  const tempZipPath = path.join(__dirname, 'dist', 'streamarmor-toolkit.zip');

  // Ensure dist exists
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  }

  const makeZipScript = path.join(toolkitDir, 'make_zip.py');
  exec(`python3 "${makeZipScript}" "${tempZipPath}"`, (error) => {
    if (error || !fs.existsSync(tempZipPath)) {
      return res.status(500).send('Failed to package zip bundle.');
    }
    res.setHeader('Content-Disposition', 'attachment; filename="streamarmor-python-toolkit.zip"');
    res.setHeader('Content-Type', 'application/zip');
    fs.createReadStream(tempZipPath).pipe(res);
  });
});

// POST /api/hash-check: Calculate SHA-256 for a string or remote url
app.post('/api/hash-check', async (req: Request, res: Response) => {
  const { input, type } = req.body;
  if (!input) {
    return res.status(400).json({ error: 'Input text or URL is required.' });
  }

  if (type === 'string') {
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    const md5 = crypto.createHash('md5').update(input).digest('hex');
    return res.json({
      sha256: hash,
      md5,
      virustotalUrl: `https://www.virustotal.com/gui/file/${hash}`
    });
  }

  // If URL, probe first 64KB
  try {
    const resp = await fetch(input, {
      headers: { 'Range': 'bytes=0-65535' }
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Upstream HTTP ${resp.status}` });
    }
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const md5 = crypto.createHash('md5').update(buffer).digest('hex');
    return res.json({
      sha256: hash,
      md5,
      bytesSampled: buffer.length,
      virustotalUrl: `https://www.virustotal.com/gui/file/${hash}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Hash generation failed' });
  }
});

// GET /sessions.md: Serve sessions documentation
app.get('/sessions.md', (_req: Request, res: Response) => {
  const sessionPath = path.join(__dirname, 'sessions.md');
  if (fs.existsSync(sessionPath)) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="sessions.md"');
    res.sendFile(sessionPath);
  } else {
    res.status(404).send('sessions.md not found');
  }
});

// -------------------------------------------------------------
// VITE DEV MIDDLEWARE / STATIC FILE SERVING
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StreamArmor Server] Running at http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('[StreamArmor Server Error]', err);
});
