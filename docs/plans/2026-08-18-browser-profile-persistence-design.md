# Browser profile persistence design

## Problem

The browser bridge previously changed its default profile directory during skill renames and browser-route changes. Existing login state remained on disk, but a later launch could select another empty directory and appear to log the user out.

## Design

Use a shared resolver for both Playwright and native CDP launchers. Explicit `--profile` selection has highest priority, followed by a remembered successful choice stored outside the skill at `~/.resume-autofill-agent/browser-state.json`. With no remembered choice, discover known legacy directories. Reuse one browser-specific initialized candidate; if several exist, or an old shared profile cannot be attributed safely to Chrome or Edge, stop with a clear conflict instead of guessing. Never accept the user's everyday Chrome or Edge profile.

After a browser successfully launches, remember its isolated profile, browser type, route, and CDP port. A reinstall cannot remove this state because it lives outside the skill directory. CDP reuse is allowed automatically only when the remembered browser and port match; otherwise fail closed and require an explicit profile choice.

## Verification

Node tests cover a fresh install, legacy upgrade, remembered reuse, multiple-profile conflicts, explicit repair, forbidden everyday profiles, and missing remembered directories. Run the bridge doctor and native launcher doctor to verify their structured output includes profile path, source, and state file.
