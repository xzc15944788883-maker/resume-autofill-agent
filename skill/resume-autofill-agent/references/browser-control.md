# Browser Control Guide

## Route selection

Use the first route that passes a real page probe:

1. Host-native browser or computer-use tool: list tabs and read the target page.
2. Connected browser MCP or extension: run one page-list or snapshot call. Treat initialization errors, inactive workers, or missing tabs as a failed probe.
3. Bundled Playwright bridge: run an isolated persistent browser profile and let the user complete login or CAPTCHA in that window.
4. Native browser launch plus local CDP attach: use when an identity provider rejects a Playwright-launched browser. Start Chrome or Edge normally with a fixed loopback debugging port and a separate profile, let the user finish login, then attach the bridge with `--cdp`.
5. Manual fill sheet: use only when all control routes fail.

After two identical initialization failures, record the error and switch routes. Installation or an enabled toggle is not proof that control works.

## Playwright bridge setup

The bridge uses a separate browser profile and never copies the user's main browser profile, cookies, tokens, or saved passwords. A blank browser that asks for login on first launch is therefore expected; it does not mean the user's normal Google session was lost.

Chrome is preferred by default. The resolver stores the last successful isolated profile choice at `~/.resume-autofill-agent/browser-state.json`, outside the skill installation. Direct Playwright launch and native CDP launch use that remembered path. On upgrade it also detects known `student-resume-autofill` and `browser-profile` directories. If several initialized profiles exist, it reports `PROFILE_CONFLICT`; if an old shared directory cannot be attributed safely to Chrome or Edge, it reports `AMBIGUOUS_LEGACY_PROFILE`. Both errors refuse to open a browser rather than guessing and appearing to log the user out. The skill must never delete the state file or selected profile.

From `scripts/browser-bridge`:

```bash
npm install --ignore-scripts
node browser_bridge.cjs --doctor --browser chrome
node browser_bridge.cjs --browser chrome --url "https://example.com/application"
```

If the host already bundles `playwright` or `playwright-core`, the bridge tries that first and may not require installation. `--doctor` reports dependency and browser detection without opening a page.

Honor the user's browser preference. Use `--browser chrome` or `--browser edge`, and pass `--executable "/path/to/chrome"` to select an installation. Run `--doctor` before launch and inspect `profile`, `profileSource`, and `profileState`. A successful launch remembers the choice automatically. To repair a conflict, launch once with `--profile "/path/to/the/existing-isolated-profile"`; this pins that path for later launches. Never point `--profile` at the everyday Chrome or Edge profile—the resolver rejects it because concurrent browser locking can fail or corrupt it. If an identity-provider login fails in one browser, switch to the user's preferred installed browser instead of retrying the same route.

The bridge removes Playwright's default `--enable-automation` launch flag because some identity providers reject browsers that expose that marker. This improves compatibility but does not bypass CAPTCHA, MFA, risk checks, or access controls.

If that is still rejected, do not retry. Launch the browser natively with an isolated profile and a fixed loopback debugging port, complete login before attaching, then run:

```bash
node native_cdp_launcher.cjs --doctor --browser chrome --port 9333
node native_cdp_launcher.cjs --browser chrome --port 9333 --url "https://example.com/application"
# Complete login, CAPTCHA, passkey, or MFA in the opened browser first.
node browser_bridge.cjs --cdp "http://127.0.0.1:9333"
```

Bind the debugging port to loopback only and never expose it to the network. The native launcher reuses an occupied port only when its browser profile and port match the remembered state; otherwise it fails with `UNVERIFIED_CDP_ENDPOINT`. When repairing an older running browser, attach once with both `--cdp` and its isolated `--profile` path to remember that identity. Disconnecting from CDP leaves the native browser open so its isolated login state can be reused.

Read stdout until `@@RESUMEFILL@@{"ready":true,...}` appears. Keep the process alive and send one JSON object per stdin line. Parse only lines beginning with `@@RESUMEFILL@@` as protocol responses.

## Command protocol

```json
{"cmd":"pages"}
{"cmd":"snapshot","includeValues":false}
{"cmd":"goto","url":"https://example.com/application"}
{"cmd":"fill","label":"Full name","value":"Example Student"}
{"cmd":"fill","placeholder":"Email","value":"verified-address-from-profile"}
{"cmd":"select","label":"Degree","value":"master"}
{"cmd":"press","label":"Graduation date","key":"ArrowDown"}
{"cmd":"upload","selector":"input[type=file]","paths":["C:/delivery/resume.pdf"]}
{"cmd":"click","role":"button","name":"Save draft"}
{"cmd":"screenshot","path":"C:/delivery/application-check.png","fullPage":true}
```

Use `selector` only when stable visible labels, placeholders, or roles are unavailable. `snapshot` returns visible controls and nearby text; password values are always redacted. Set `includeValues` only when the authorized local workflow needs to verify entered values, and never copy a sensitive snapshot into public artifacts.

## Operating sequence

1. Open the exact application URL and verify the title/domain.
2. Run `--doctor` and verify `profileSource`. Reuse `remembered`; repair `PROFILE_CONFLICT` or `AMBIGUOUS_LEGACY_PROFILE` with the known isolated path. Treat `canonical-new` as first-time login. If the target page proves that a remembered session has expired, keep the same profile while the user restores it. Allow the user to complete login, CAPTCHA, passkey, or MFA in the isolated window. Never request or store those secrets.
3. Snapshot visible controls and map them to the source ledger.
4. If resume parsing can overwrite fields, upload the resume first and wait for parsing.
5. Fill one logical section at a time. Read back identity, dates, education, and repeated entries.
6. Upload only privacy-checked delivery copies. Verify the displayed filename and upload state.
7. Click only reversible controls such as “Save draft.” The bridge blocks submit-like clicks unless `confirmIrreversible` is true; the agent may set it only after the user explicitly confirms the exact action immediately beforehand.
8. Re-snapshot critical fields and report unresolved items.

## Safety boundaries

- Never clone or reuse the main browser profile to obtain login state.
- Never extract cookies, tokens, passwords, browser databases, or credential-manager entries.
- Keep form data local and omit sensitive values from shared logs and screenshots.
- Do not bypass CAPTCHA, MFA, access controls, or anti-bot protections.
- Do not submit, sign, consent, withdraw, pay, or send a final application without immediate explicit confirmation.
- Close the bridge when work finishes; keep the isolated profile only when the user wants reusable login state.
