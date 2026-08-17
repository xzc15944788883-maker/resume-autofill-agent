const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const MARKER = '@@RESUMEFILL_LAUNCH@@';
const args = process.argv.slice(2);
const arg = (name, fallback = '') => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (name) => args.includes(name);
const emit = (value) => process.stdout.write(`${MARKER}${JSON.stringify(value)}\n`);

function candidates(preference) {
  const custom = arg('--executable');
  if (custom) return [custom];
  const chrome = [];
  const edge = [];
  if (process.platform === 'win32') {
    chrome.push('C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe');
    edge.push('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe');
  } else if (process.platform === 'darwin') {
    chrome.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    edge.push('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    chrome.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser');
    edge.push('/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable');
  }
  return preference === 'edge' ? [...edge, ...chrome] : [...chrome, ...edge];
}

function detectBrowser() {
  const preference = arg('--browser', 'chrome').toLowerCase();
  return candidates(preference).find((item) => fs.existsSync(item));
}

function safeUrl(raw) {
  const parsed = new URL(raw || 'https://example.com');
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http:// and https:// URLs are allowed.');
  return parsed.toString();
}

function getJson(port, route = '/json/version', method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port, path: route, method, timeout: 1500 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    request.on('timeout', () => request.destroy(new Error('timeout')));
    request.on('error', reject);
    request.end();
  });
}

async function waitForEndpoint(port, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { return await getJson(port); } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Browser did not expose CDP on 127.0.0.1:${port}`);
}

(async () => {
  const executable = detectBrowser();
  const port = Number(arg('--port', '9333'));
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Use a TCP port between 1024 and 65535.');
  if (!executable) throw new Error('No supported Chrome or Edge executable found. Use --executable PATH.');
  const profile = path.resolve(arg('--profile') || path.join(os.homedir(), '.student-resume-autofill', `native-cdp-${arg('--browser', 'chrome')}`));
  const url = safeUrl(arg('--url', 'https://example.com'));
  if (has('--doctor')) {
    emit({ doctor: true, executable, profile, port, endpoint: `http://127.0.0.1:${port}` });
    return;
  }

  try {
    const existing = await getJson(port);
    const target = await getJson(port, `/json/new?${encodeURIComponent(url)}`, 'PUT').catch(() => null);
    emit({ ready: true, reused: true, executable, profile: null, port, endpoint: `http://127.0.0.1:${port}`, browser: existing.Browser || null, targetId: target?.id || null });
    return;
  } catch {}

  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(executable, [
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--new-window',
    url
  ], { detached: true, stdio: 'ignore' });
  child.unref();
  const version = await waitForEndpoint(port);
  emit({ ready: true, reused: false, pid: child.pid, executable, profile, port, endpoint: `http://127.0.0.1:${port}`, browser: version.Browser || null });
})().catch((error) => {
  emit({ fatal: String(error), stack: error?.stack });
  process.exit(1);
});
