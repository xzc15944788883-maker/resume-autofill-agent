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

The bridge uses a separate browser profile and never copies the user's main browser profile, cookies, tokens, or saved passwords.

From `scripts/browser-bridge`:

```bash
npm install --ignore-scripts
node browser_bridge.cjs --doctor
node browser_bridge.cjs --url "https://example.com/application"
```

If the host already bundles `playwright` or `playwright-core`, the bridge tries that first and may not require installation. `--doctor` reports dependency and browser detection without opening a page.

Honor the user's browser preference. Pass `--executable "/path/to/chrome"` to force Chrome or another supported Chromium browser, and `--profile "/path/to/isolated-profile"` to keep its reusable login state separate. If an identity-provider login fails in one browser, switch to the user's preferred installed browser instead of retrying the same route.

The bridge removes Playwright's default `--enable-automation` launch flag because some identity providers reject browsers that expose that marker. This improves compatibility but does not bypass CAPTCHA, MFA, risk checks, or access controls.

If that is still rejected, do not retry. Launch the browser natively with an isolated profile and a fixed loopback debugging port, complete login before attaching, then run:

```bash
node native_cdp_launcher.cjs --doctor --browser chrome --port 9333
node native_cdp_launcher.cjs --browser chrome --port 9333 --url "https://example.com/application"
# Complete login, CAPTCHA, passkey, or MFA in the opened browser first.
node browser_bridge.cjs --cdp "http://127.0.0.1:9333"
```

Bind the debugging port to loopback only, verify the port is unused first, and never expose it to the network. The bridge refuses non-loopback CDP endpoints. Disconnecting from CDP leaves the native browser open so its isolated login state can be reused.

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
2. Allow the user to complete login, CAPTCHA, passkey, or MFA in the isolated window. Never request or store those secrets.
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
