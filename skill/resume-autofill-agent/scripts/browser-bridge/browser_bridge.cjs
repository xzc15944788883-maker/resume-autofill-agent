const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');
const {
  ProfileResolutionError,
  normalizeBrowserName,
  rememberedProfile,
  rememberProfile,
  resolveProfile
} = require('./profile_resolver.cjs');

const MARKER = '@@RESUMEFILL@@';
const args = process.argv.slice(2);
const arg = (name, fallback = '') => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (name) => args.includes(name);

function emit(value) {
  process.stdout.write(`\n${MARKER}${JSON.stringify(value)}\n`);
}

function loadPlaywright() {
  const candidates = ['playwright-core', 'playwright'];
  const extra = process.env.CODEX_PLAYWRIGHT_PATH;
  if (extra) candidates.unshift(extra);
  if (process.platform === 'win32') {
    candidates.push(path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright'));
  }
  const errors = [];
  for (const candidate of candidates) {
    try {
      return { module: require(candidate), source: candidate };
    } catch (error) {
      errors.push(`${candidate}: ${error.code || error.message}`);
    }
  }
  throw new Error(`Playwright is unavailable. Run npm install --ignore-scripts in ${__dirname}. Tried: ${errors.join('; ')}`);
}

function browserCandidates() {
  const custom = arg('--executable') || process.env.RESUME_AUTOFILL_BROWSER || process.env.STUDENT_RESUME_BROWSER;
  if (custom) return [custom];
  const chrome = [];
  const edge = [];
  if (process.platform === 'win32') {
    chrome.push(
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
    );
    edge.push(
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
    );
  } else if (process.platform === 'darwin') {
    chrome.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    edge.push('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    chrome.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser');
    edge.push('/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable');
  }
  return arg('--browser', 'chrome').toLowerCase() === 'edge' ? [...edge, ...chrome] : [...chrome, ...edge];
}

function detectBrowser() {
  return browserCandidates().find((candidate) => fs.existsSync(candidate));
}

function safeUrl(raw) {
  const parsed = new URL(raw);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http:// and https:// URLs are allowed.');
  return parsed.toString();
}

function explicitProfile() {
  return arg('--profile') || process.env.RESUME_AUTOFILL_BROWSER_PROFILE || process.env.STUDENT_RESUME_BROWSER_PROFILE;
}

function profileError(error) {
  return {
    code: error?.code || 'PROFILE_RESOLUTION_FAILED',
    message: error?.message || String(error),
    details: error?.details || {}
  };
}

function locatorFor(page, request, clickMode = false) {
  if (request.selector) return page.locator(request.selector);
  if (request.label) return page.getByLabel(request.label, { exact: request.exact === true });
  if (request.placeholder) return page.getByPlaceholder(request.placeholder, { exact: request.exact === true });
  if (request.role) return page.getByRole(request.role, { name: request.name, exact: request.exact === true });
  if (request.testId) return page.getByTestId(request.testId);
  if (clickMode && (request.text || request.name)) return page.getByText(request.text || request.name, { exact: request.exact === true });
  throw new Error('Provide selector, label, placeholder, role/name, testId, or clickable text.');
}

async function pageSummary(page, includeValues) {
  return page.evaluate(({ includeValues }) => {
    const visible = (el) => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
    };
    const controls = [...document.querySelectorAll('input, textarea, select, [contenteditable="true"], button, [role="button"]')]
      .filter(visible)
      .slice(0, 500)
      .map((el, index) => {
        const type = el.getAttribute('type') || '';
        const labels = el.labels ? [...el.labels].map((label) => label.innerText.trim()).filter(Boolean) : [];
        const nearby = el.closest('.ant-form-item, .el-form-item, .form-item, [class*="formItem"], [class*="form-item"]');
        let value = '';
        if (type === 'password') value = '<redacted>';
        else if (includeValues) value = 'value' in el ? String(el.value || '') : String(el.innerText || '');
        return {
          index,
          tag: el.tagName.toLowerCase(),
          type,
          id: el.id || '',
          name: el.getAttribute('name') || '',
          role: el.getAttribute('role') || '',
          placeholder: el.getAttribute('placeholder') || '',
          ariaLabel: el.getAttribute('aria-label') || '',
          labels,
          text: (el.innerText || '').trim().slice(0, 160),
          nearbyText: nearby ? nearby.innerText.trim().slice(0, 240) : '',
          value,
          checked: 'checked' in el ? Boolean(el.checked) : undefined,
          disabled: Boolean(el.disabled) || el.getAttribute('aria-disabled') === 'true'
        };
      });
    return { title: document.title, bodyText: (document.body?.innerText || '').slice(0, 30000), controls };
  }, { includeValues: Boolean(includeValues) });
}

function looksIrreversible(text) {
  return /(^|\s)(submit|apply now|send application|sign|consent|withdraw|pay|confirm application)(\s|$)|提交|投递|发送申请|签署|同意|撤回|付款|确认申请/i.test(text || '');
}

(async () => {
  let dependency;
  try {
    dependency = loadPlaywright();
  } catch (error) {
    if (has('--doctor')) {
      emit({ doctor: true, playwright: false, browser: detectBrowser() || null, error: String(error) });
      process.exit(1);
    }
    throw error;
  }
  const executablePath = detectBrowser();
  const cdpEndpoint = arg('--cdp');
  let cdpPort = null;
  if (cdpEndpoint) {
    const endpoint = new URL(cdpEndpoint);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname)) throw new Error('For safety, --cdp must use a loopback endpoint.');
    cdpPort = Number(endpoint.port || 0);
  }
  const browserName = normalizeBrowserName(arg('--browser', 'chrome'), executablePath);
  let profileSelection = null;
  try {
    if (has('--doctor') || !cdpEndpoint || explicitProfile()) {
      profileSelection = resolveProfile({ browserName, executablePath, explicitProfile: explicitProfile() });
    } else {
      profileSelection = rememberedProfile({ browserName, executablePath });
      if (profileSelection && profileSelection.record.cdpPort !== cdpPort) {
        throw new ProfileResolutionError(
          'UNVERIFIED_CDP_ENDPOINT',
          `CDP endpoint port ${cdpPort || 'unknown'} does not match the remembered port ${profileSelection.record.cdpPort || 'none'} for ${profileSelection.path}. Pass --profile PATH only after verifying the running browser identity.`,
          { cdpPort, profile: profileSelection.path, rememberedPort: profileSelection.record.cdpPort }
        );
      }
    }
  } catch (error) {
    if (has('--doctor')) {
      emit({ doctor: true, playwright: true, playwrightSource: dependency.source, browser: executablePath || null, cdpEndpoint: cdpEndpoint || null, profileError: profileError(error) });
      process.exit(2);
    }
    throw error;
  }
  if (has('--doctor')) {
    emit({ doctor: true, playwright: true, playwrightSource: dependency.source, browser: executablePath || null, browserName, profile: profileSelection.path, profileSource: profileSelection.source, profileState: profileSelection.stateFile, profileCandidates: profileSelection.candidates || [], cdpEndpoint: cdpEndpoint || null });
    process.exit(executablePath || cdpEndpoint ? 0 : 1);
  }
  if (!executablePath && !cdpEndpoint) throw new Error('No supported Edge, Chrome, or Chromium executable was found. Use --executable PATH or --cdp URL.');

  let browser = null;
  let connectedOverCdp = false;
  let context;
  if (cdpEndpoint) {
    const endpoint = new URL(cdpEndpoint);
    browser = await dependency.module.chromium.connectOverCDP(endpoint.toString());
    context = browser.contexts()[0];
    if (!context) throw new Error('The CDP browser has no usable context.');
    connectedOverCdp = true;
  } else {
    context = await dependency.module.chromium.launchPersistentContext(profileSelection.path, {
      executablePath,
      headless: has('--headless'),
      viewport: null,
      ignoreDefaultArgs: ['--enable-automation'],
      args: ['--start-maximized', '--no-first-run', '--no-default-browser-check']
    });
  }
  if (profileSelection) {
    profileSelection = rememberProfile({
      browserName,
      executablePath,
      profile: profileSelection.path,
      mode: connectedOverCdp ? 'cdp-attach' : 'persistent',
      cdpPort: Number.isInteger(cdpPort) && cdpPort > 0 ? cdpPort : null
    });
  }
  let activePage = context.pages()[0] || await context.newPage();
  const startUrl = arg('--url');
  if (startUrl) await activePage.goto(safeUrl(startUrl), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await activePage.bringToFront();
  let connectedBrowserVersion = '';
  if (connectedOverCdp) {
    try {
      connectedBrowserVersion = browser.version();
    } catch {}
  }
  emit({ ready: true, mode: connectedOverCdp ? 'cdp' : 'persistent', playwrightSource: dependency.source, browserExecutable: connectedOverCdp ? null : executablePath, browserVersion: connectedBrowserVersion || null, browserName, profile: profileSelection?.path || null, profileSource: profileSelection?.source || null, profileState: profileSelection?.stateFile || null, profileWarning: connectedOverCdp && !profileSelection ? 'CDP attached without a remembered profile identity. Reconnect once with --profile PATH to pin the reusable login profile.' : null, cdpEndpoint: connectedOverCdp ? cdpEndpoint : null, pages: await Promise.all(context.pages().map(async (page, index) => ({ index, url: page.url(), title: await page.title().catch(() => '') }))) });

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line);
      if (request.cmd === 'pages') {
        emit({ pages: await Promise.all(context.pages().map(async (page, index) => ({ index, active: page === activePage, url: page.url(), title: await page.title().catch(() => '') }))) });
      } else if (request.cmd === 'usePage') {
        const pages = context.pages();
        const next = Number.isInteger(request.index) ? pages[request.index] : pages.find((page) => page.url().includes(request.urlIncludes || ''));
        if (!next) throw new Error('Requested page was not found.');
        activePage = next;
        await activePage.bringToFront();
        emit({ activePage: { url: activePage.url(), title: await activePage.title() } });
      } else if (request.cmd === 'snapshot') {
        emit({ url: activePage.url(), ...(await pageSummary(activePage, request.includeValues)) });
      } else if (request.cmd === 'goto') {
        await activePage.goto(safeUrl(request.url), { waitUntil: 'domcontentloaded', timeout: 60000 });
        emit({ url: activePage.url(), title: await activePage.title() });
      } else if (request.cmd === 'fill') {
        const target = locatorFor(activePage, request);
        await target.first().fill(String(request.value ?? ''));
        emit({ filled: request.label || request.placeholder || request.selector || request.name || request.testId });
      } else if (request.cmd === 'select') {
        const target = locatorFor(activePage, request);
        await target.first().selectOption(request.value);
        emit({ selected: request.label || request.selector || request.name, value: request.value });
      } else if (request.cmd === 'press') {
        const target = locatorFor(activePage, request);
        await target.first().press(request.key);
        emit({ pressed: request.key });
      } else if (request.cmd === 'upload') {
        const target = locatorFor(activePage, request);
        const paths = (Array.isArray(request.paths) ? request.paths : [request.path]).filter(Boolean).map((item) => path.resolve(item));
        if (!paths.length) throw new Error('Provide path or paths for upload.');
        for (const item of paths) if (!fs.existsSync(item)) throw new Error(`Upload file does not exist: ${item}`);
        await target.first().setInputFiles(paths);
        emit({ uploaded: paths.map((item) => path.basename(item)) });
      } else if (request.cmd === 'click') {
        const target = locatorFor(activePage, request, true).first();
        const text = `${request.text || ''} ${request.name || ''} ${await target.innerText().catch(() => '')} ${await target.getAttribute('value').catch(() => '')}`;
        if (looksIrreversible(text) && request.confirmIrreversible !== true) throw new Error('Blocked irreversible click. Obtain immediate explicit user confirmation, then set confirmIrreversible=true.');
        await target.click();
        emit({ clicked: request.text || request.name || request.label || request.selector, url: activePage.url() });
      } else if (request.cmd === 'wait') {
        await activePage.waitForTimeout(Math.min(Math.max(Number(request.ms) || 500, 0), 10000));
        emit({ waitedMs: Math.min(Math.max(Number(request.ms) || 500, 0), 10000) });
      } else if (request.cmd === 'screenshot') {
        const output = path.resolve(request.path);
        await activePage.screenshot({ path: output, fullPage: request.fullPage !== false });
        emit({ screenshot: output });
      } else if (request.cmd === 'close') {
        emit({ closing: true, browserRemainsOpen: connectedOverCdp });
        if (!connectedOverCdp) await context.close();
        process.exit(0);
      } else {
        throw new Error(`Unknown command: ${request.cmd}`);
      }
    } catch (error) {
      emit({ error: String(error), stack: error?.stack });
    }
  });
  context.on('close', () => process.exit(0));
})().catch((error) => {
  emit({ fatal: String(error), stack: error?.stack });
  process.exit(1);
});
