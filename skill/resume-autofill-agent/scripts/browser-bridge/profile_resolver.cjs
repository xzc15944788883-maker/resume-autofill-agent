const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const STATE_VERSION = 1;

class ProfileResolutionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ProfileResolutionError';
    this.code = code;
    this.details = details;
  }
}

function unique(items) {
  return [...new Set(items.map((item) => path.resolve(item)))];
}

function normalizeBrowserName(preference = 'chrome', executablePath = '') {
  if (/edge/i.test(path.basename(executablePath || ''))) return 'edge';
  if (/chrome|chromium/i.test(path.basename(executablePath || ''))) return 'chrome';
  return String(preference || 'chrome').toLowerCase() === 'edge' ? 'edge' : 'chrome';
}

function stateFilePath(homeDir = os.homedir(), explicitStatePath = '') {
  return path.resolve(explicitStatePath || process.env.RESUME_AUTOFILL_BROWSER_STATE || path.join(homeDir, '.resume-autofill-agent', 'browser-state.json'));
}

function canonicalProfilePath(homeDir, browserName) {
  return path.resolve(homeDir, '.resume-autofill-agent', `native-cdp-${browserName}`);
}

function legacyProfilePaths(homeDir, browserName) {
  const shared = sharedLegacyProfilePaths(homeDir);
  if (browserName === 'edge') {
    return unique([
      path.join(homeDir, '.student-resume-autofill', 'edge-native-profile'),
      path.join(homeDir, '.student-resume-autofill', 'native-cdp-edge'),
      ...shared
    ]);
  }
  return unique([
    path.join(homeDir, '.student-resume-autofill', 'chrome-native-profile'),
    path.join(homeDir, '.student-resume-autofill', 'native-cdp-chrome'),
    ...shared
  ]);
}

function sharedLegacyProfilePaths(homeDir) {
  return unique([
    path.join(homeDir, '.resume-autofill-agent', 'browser-profile'),
    path.join(homeDir, '.student-resume-autofill', 'browser-profile')
  ]);
}

function isInside(candidate, parent, platform = process.platform) {
  const normalize = (value) => platform === 'win32' ? value.toLowerCase() : value;
  const resolvedCandidate = normalize(path.resolve(candidate));
  const resolvedParent = normalize(path.resolve(parent));
  const relative = path.relative(resolvedParent, resolvedCandidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function everydayProfileRoots(homeDir, platform = process.platform, env = process.env) {
  if (platform === 'win32') {
    const localAppData = env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
    return [
      path.join(localAppData, 'Google', 'Chrome', 'User Data'),
      path.join(localAppData, 'Microsoft', 'Edge', 'User Data')
    ];
  }
  if (platform === 'darwin') {
    return [
      path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome'),
      path.join(homeDir, 'Library', 'Application Support', 'Microsoft Edge')
    ];
  }
  return [
    path.join(homeDir, '.config', 'google-chrome'),
    path.join(homeDir, '.config', 'chromium'),
    path.join(homeDir, '.config', 'microsoft-edge')
  ];
}

function assertSafeProfile(profile, options = {}) {
  const homeDir = path.resolve(options.homeDir || os.homedir());
  const platform = options.platform || process.platform;
  const resolved = path.resolve(profile);
  const dangerous = [path.parse(resolved).root, homeDir, path.join(homeDir, '.resume-autofill-agent'), path.join(homeDir, '.student-resume-autofill')];
  if (dangerous.some((item) => resolved === path.resolve(item))) {
    throw new ProfileResolutionError('UNSAFE_PROFILE', `Refusing broad browser profile path: ${resolved}`, { profile: resolved });
  }
  const everydayRoot = everydayProfileRoots(homeDir, platform, options.env).find((root) => isInside(resolved, root, platform));
  if (everydayRoot) {
    throw new ProfileResolutionError('MAIN_PROFILE_FORBIDDEN', `Refusing the everyday browser profile. Use an isolated profile outside ${everydayRoot}.`, { profile: resolved, everydayRoot });
  }
  return resolved;
}

function isInitializedProfile(profile, fsImpl = fs) {
  try {
    if (!fsImpl.statSync(profile).isDirectory()) return false;
    return ['Local State', 'Default', 'First Run'].some((marker) => fsImpl.existsSync(path.join(profile, marker)));
  } catch {
    return false;
  }
}

function readState(options = {}) {
  const fsImpl = options.fsImpl || fs;
  const file = stateFilePath(options.homeDir || os.homedir(), options.statePath || '');
  if (!fsImpl.existsSync(file)) return { file, state: { version: STATE_VERSION, browserProfiles: {} } };
  try {
    const parsed = JSON.parse(fsImpl.readFileSync(file, 'utf8'));
    if (parsed.version !== STATE_VERSION || !parsed.browserProfiles || typeof parsed.browserProfiles !== 'object') {
      throw new Error(`expected version ${STATE_VERSION}`);
    }
    return { file, state: parsed };
  } catch (error) {
    throw new ProfileResolutionError('INVALID_PROFILE_STATE', `Browser profile state is invalid: ${file}. Repair or remove it explicitly instead of silently starting a new profile.`, { file, cause: String(error) });
  }
}

function rememberedProfile(options = {}) {
  const browserName = normalizeBrowserName(options.browserName, options.executablePath);
  const homeDir = options.homeDir || os.homedir();
  const fsImpl = options.fsImpl || fs;
  const { file, state } = readState({ ...options, homeDir, fsImpl });
  const record = state.browserProfiles[browserName];
  if (!record?.path) return null;
  const profile = assertSafeProfile(record.path, options);
  if (!isInitializedProfile(profile, fsImpl)) {
    throw new ProfileResolutionError('PINNED_PROFILE_MISSING', `The remembered ${browserName} profile is missing or uninitialized: ${profile}. Pass --profile with the correct existing directory to repair the choice.`, { browserName, profile, stateFile: file });
  }
  return { path: profile, source: 'remembered', stateFile: file, record };
}

function resolveProfile(options = {}) {
  const homeDir = options.homeDir || os.homedir();
  const fsImpl = options.fsImpl || fs;
  const browserName = normalizeBrowserName(options.browserName, options.executablePath);
  const explicit = options.explicitProfile || '';
  const stateFile = stateFilePath(homeDir, options.statePath || '');
  if (explicit) {
    return { path: assertSafeProfile(explicit, options), source: 'explicit', browserName, stateFile, candidates: [] };
  }

  const pinned = rememberedProfile({ ...options, browserName, homeDir, fsImpl });
  if (pinned) return { ...pinned, browserName, candidates: [] };

  const canonical = canonicalProfilePath(homeDir, browserName);
  const candidates = unique([canonical, ...legacyProfilePaths(homeDir, browserName)]);
  const initialized = candidates.filter((candidate) => isInitializedProfile(candidate, fsImpl));
  if (initialized.length > 1) {
    throw new ProfileResolutionError(
      'PROFILE_CONFLICT',
      `Multiple initialized ${browserName} profiles exist. Refusing to choose silently because that can look like a logout. Start once with --profile PATH to pin the correct profile.`,
      { browserName, candidates: initialized, stateFile }
    );
  }
  if (initialized.length === 1) {
    const selected = initialized[0];
    if (sharedLegacyProfilePaths(homeDir).includes(selected)) {
      throw new ProfileResolutionError(
        'AMBIGUOUS_LEGACY_PROFILE',
        `An initialized shared legacy profile exists, but its Chrome or Edge identity is unknown: ${selected}. Start once with the correct --browser and --profile values to pin it safely.`,
        { browserName, candidates: initialized, stateFile }
      );
    }
    return {
      path: selected,
      source: selected === canonical ? 'canonical-existing' : 'legacy-discovered',
      browserName,
      stateFile,
      candidates: initialized
    };
  }
  return { path: canonical, source: 'canonical-new', browserName, stateFile, candidates: [] };
}

function rememberProfile(options = {}) {
  const fsImpl = options.fsImpl || fs;
  const homeDir = options.homeDir || os.homedir();
  const browserName = normalizeBrowserName(options.browserName, options.executablePath);
  const profile = assertSafeProfile(options.profile, options);
  if (!isInitializedProfile(profile, fsImpl)) {
    throw new ProfileResolutionError('PROFILE_NOT_INITIALIZED', `Cannot remember an uninitialized browser profile: ${profile}`, { profile });
  }
  const { file, state } = readState({ ...options, homeDir, fsImpl });
  fsImpl.mkdirSync(path.dirname(file), { recursive: true });
  state.browserProfiles[browserName] = {
    path: profile,
    browser: browserName,
    mode: options.mode || 'persistent',
    cdpPort: Number.isInteger(options.cdpPort) ? options.cdpPort : null,
    updatedAt: new Date().toISOString()
  };
  fsImpl.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return { path: profile, source: 'remembered', browserName, stateFile: file, record: state.browserProfiles[browserName] };
}

module.exports = {
  ProfileResolutionError,
  assertSafeProfile,
  canonicalProfilePath,
  isInitializedProfile,
  legacyProfilePaths,
  normalizeBrowserName,
  readState,
  rememberedProfile,
  rememberProfile,
  resolveProfile,
  sharedLegacyProfilePaths,
  stateFilePath
};
