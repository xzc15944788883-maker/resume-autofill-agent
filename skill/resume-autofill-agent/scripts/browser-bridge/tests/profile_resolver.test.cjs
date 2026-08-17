const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  ProfileResolutionError,
  canonicalProfilePath,
  normalizeBrowserName,
  rememberProfile,
  resolveProfile
} = require('../profile_resolver.cjs');

function temporaryHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'resume-profile-test-'));
}

function initializeProfile(profile) {
  fs.mkdirSync(path.join(profile, 'Default'), { recursive: true });
  fs.writeFileSync(path.join(profile, 'Local State'), '{}');
  return profile;
}

test('uses the canonical isolated profile when no previous profile exists', () => {
  const homeDir = temporaryHome();
  const result = resolveProfile({ homeDir, browserName: 'chrome' });
  assert.equal(result.path, canonicalProfilePath(homeDir, 'chrome'));
  assert.equal(result.source, 'canonical-new');
});

test('discovers a single initialized legacy profile instead of creating an empty profile', () => {
  const homeDir = temporaryHome();
  const legacy = initializeProfile(path.join(homeDir, '.student-resume-autofill', 'chrome-native-profile'));
  const result = resolveProfile({ homeDir, browserName: 'chrome' });
  assert.equal(result.path, legacy);
  assert.equal(result.source, 'legacy-discovered');
});

test('requires an explicit browser choice for a shared legacy profile', () => {
  const homeDir = temporaryHome();
  initializeProfile(path.join(homeDir, '.resume-autofill-agent', 'browser-profile'));
  assert.throws(
    () => resolveProfile({ homeDir, browserName: 'chrome' }),
    (error) => error instanceof ProfileResolutionError && error.code === 'AMBIGUOUS_LEGACY_PROFILE'
  );
});

test('uses the detected executable product when a preferred browser falls back', () => {
  assert.equal(normalizeBrowserName('edge', '/opt/google/chrome'), 'chrome');
  assert.equal(normalizeBrowserName('chrome', '/opt/microsoft/msedge'), 'edge');
});

test('a remembered profile wins on every later launch', () => {
  const homeDir = temporaryHome();
  const legacy = initializeProfile(path.join(homeDir, '.student-resume-autofill', 'chrome-native-profile'));
  initializeProfile(canonicalProfilePath(homeDir, 'chrome'));
  rememberProfile({ homeDir, browserName: 'chrome', profile: legacy, mode: 'native-cdp', cdpPort: 9333 });
  const result = resolveProfile({ homeDir, browserName: 'chrome' });
  assert.equal(result.path, legacy);
  assert.equal(result.source, 'remembered');
  assert.equal(result.record.cdpPort, 9333);
});

test('refuses to choose silently when multiple initialized profiles exist without a remembered choice', () => {
  const homeDir = temporaryHome();
  initializeProfile(canonicalProfilePath(homeDir, 'chrome'));
  initializeProfile(path.join(homeDir, '.student-resume-autofill', 'chrome-native-profile'));
  assert.throws(
    () => resolveProfile({ homeDir, browserName: 'chrome' }),
    (error) => error instanceof ProfileResolutionError && error.code === 'PROFILE_CONFLICT' && error.details.candidates.length === 2
  );
});

test('an explicit isolated profile repairs a conflict and can be remembered', () => {
  const homeDir = temporaryHome();
  const selected = initializeProfile(path.join(homeDir, 'chosen-isolated-profile'));
  initializeProfile(canonicalProfilePath(homeDir, 'chrome'));
  const explicit = resolveProfile({ homeDir, browserName: 'chrome', explicitProfile: selected });
  assert.equal(explicit.path, selected);
  assert.equal(explicit.source, 'explicit');
  rememberProfile({ homeDir, browserName: 'chrome', profile: selected });
  assert.equal(resolveProfile({ homeDir, browserName: 'chrome' }).path, selected);
});

test('never accepts the everyday Chrome profile', () => {
  const homeDir = temporaryHome();
  const mainProfile = path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  initializeProfile(mainProfile);
  assert.throws(
    () => resolveProfile({ homeDir, browserName: 'chrome', explicitProfile: mainProfile, platform: 'win32', env: {} }),
    (error) => error instanceof ProfileResolutionError && error.code === 'MAIN_PROFILE_FORBIDDEN'
  );
});

test('a missing remembered profile fails closed instead of creating a replacement', () => {
  const homeDir = temporaryHome();
  const selected = initializeProfile(path.join(homeDir, 'selected-profile'));
  rememberProfile({ homeDir, browserName: 'chrome', profile: selected });
  fs.rmSync(selected, { recursive: true });
  assert.throws(
    () => resolveProfile({ homeDir, browserName: 'chrome' }),
    (error) => error instanceof ProfileResolutionError && error.code === 'PINNED_PROFILE_MISSING'
  );
});

test('a corrupt state file fails closed instead of forgetting the selected profile', () => {
  const homeDir = temporaryHome();
  const stateFile = path.join(homeDir, '.resume-autofill-agent', 'browser-state.json');
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, '{not-json');
  assert.throws(
    () => resolveProfile({ homeDir, browserName: 'chrome' }),
    (error) => error instanceof ProfileResolutionError && error.code === 'INVALID_PROFILE_STATE'
  );
});
