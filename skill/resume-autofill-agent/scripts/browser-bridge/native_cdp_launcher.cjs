const fs = require('node:fs');
const http = require('node:http');
const { spawn } = require('node:child_process');
const {
  ProfileResolutionError,
  normalizeBrowserName,
  rememberedProfile,
  rememberProfile,
  resolveProfile
} = require('./profile_resolver.cjs');

const MARKER = '@@RESUMEFILL_LAUNCH@@';
const args = process.argv.slice(2);
const arg = (name, fallback = '') => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (name) => args.includes(name);
const emit = (value) => process.stdout.write(`${MARKER}${JSON.stringify(value)}\n`);

function explicitProfile() {
  return arg('--profile') || process.env.RESUME_AUTOFILL_BROWSER_PROFILE || process.env.STUDENT_RESUME_BROWSER_PROFILE;
}

function profileError(error) {
  return { code: error?.code || 'PROFILE_RESOLUTION_FAILED', message: error?.message || String(error), details: error?.details || {} };
}

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
  const browserName = normalizeBrowserName(arg('--browser', 'chrome'), executable);
  let profileSelection;
  try {
    profileSelection = resolveProfile({ browserName, executablePath: executable, explicitProfile: explicitProfile() });
  } catch (error) {
    if (has('--doctor')) {
      emit({ doctor: true, executable, browserName, port, endpoint: `http://127.0.0.1:${port}`, profileError: profileError(error) });
      process.exit(2);
    }
    throw error;
  }
  const profile = profileSelection.path;
  const url = safeUrl(arg('--url', 'https://example.com'));
  if (has('--doctor')) {
    emit({ doctor: true, executable, browserName, profile, profileSource: profileSelection.source, profileState: profileSelection.stateFile, profileCandidates: profileSelection.candidates || [], port, endpoint: `http://127.0.0.1:${port}` });
    return;
  }

  let existing = null;
  try {
    existing = await getJson(port);
  } catch {}
  if (existing) {
    const pinned = rememberedProfile({ browserName, executablePath: executable });
    const verified = pinned && pinned.path === profile && pinned.record.cdpPort === port;
    if (!verified) {
      throw new ProfileResolutionError(
        'UNVERIFIED_CDP_ENDPOINT',
        `CDP port ${port} is already active but is not recorded for ${profile}. Refusing to reuse an unknown browser profile. Attach explicitly with browser_bridge.cjs --cdp http://127.0.0.1:${port} --profile PATH or close that browser first.`,
        { port, profile, rememberedProfile: pinned?.path || null, rememberedPort: pinned?.record?.cdpPort || null }
      );
    }
    const target = await getJson(port, `/json/new?${encodeURIComponent(url)}`, 'PUT').catch(() => null);
    emit({ ready: true, reused: true, profileVerified: true, executable, browserName, profile, profileSource: pinned.source, profileState: pinned.stateFile, port, endpoint: `http://127.0.0.1:${port}`, browser: existing.Browser || null, targetId: target?.id || null });
    return;
  }

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
  const remembered = rememberProfile({ browserName, executablePath: executable, profile, mode: 'native-cdp', cdpPort: port });
  emit({ ready: true, reused: false, pid: child.pid, executable, browserName, profile: remembered.path, profileSource: remembered.source, profileState: remembered.stateFile, port, endpoint: `http://127.0.0.1:${port}`, browser: version.Browser || null });
})().catch((error) => {
  emit({ fatal: String(error), code: error?.code || null, details: error?.details || null, stack: error?.stack });
  process.exit(1);
});
