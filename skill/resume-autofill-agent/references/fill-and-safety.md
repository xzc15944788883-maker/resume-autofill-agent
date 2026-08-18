# Filling and Safety Guide

## Field Classes

| Class | Examples | Rule |
|---|---|---|
| Verified fact | school, degree, confirmed dates | Fill from the highest-priority source. |
| Supported rewrite | project bullet, self-evaluation | Improve wording without expanding the factual claim. |
| Sensitive fact | government ID, family, health, politics | Use only explicit or authorized current data; flag for review. |
| Optional unknown | hobbies, secondary preference | Leave blank unless a supported answer adds value. |
| Declaration | truth statement, relatives, conflicts | Require user review; never infer. |
| Irreversible action | submit, sign, consent, withdraw | Require explicit confirmation immediately before action. |

For grades, GPA, rank, and transcripts, apply data minimization: leave optional fields blank and do not upload proof unless the form explicitly requires it, the application process genuinely needs it, or the user asks. If GPA is required, use only the verified value. If rank is required but unknown, choose only a truthful option such as `unknown`, `not applicable`, or `other`; never derive a rank from GPA or invent a percentile.

## Role-Aware Supplementation

Score candidate material by relevance, evidence strength, recency, and distinctiveness. Prefer strong recent evidence. Use older evidence only to fill a real gap. Derive skill labels only from demonstrated work, and keep causal or quantitative claims exactly within the evidence.

Apply lawful and truthful strength-first selection instead of trying to fill every optional field. Prioritize evidence that improves role fit; omit optional, weak, duplicative, outdated, or unnecessarily sensitive material when omission is allowed. Never omit required facts or evade declarations. Keep a short decision note for every material inclusion or omission, stating the field, action, and reason so the user can review the tradeoff.

A good rewrite preserves all four boundaries:

1. same actor and scope;
2. same dates and organization;
3. same methods actually used;
4. same result magnitude and certainty.

## Upload and Parser Hazards

Many application sites parse an uploaded resume and overwrite manual entries. Therefore:

1. snapshot or note existing values;
2. upload first when parsing is likely;
3. wait for parsing to finish;
4. re-read identity, education, dates, and repeated sections;
5. restore verified values;
6. save and verify before leaving the page.

If an upload erases work, recover from the source ledger rather than relying on memory.

## Portfolio Attachment Workflow

1. Inspect the job description and attachment field for accepted types, maximum size, maximum count, naming rules, and whether links are preferred.
2. Rank inventory items by direct relevance, evidence strength, readability, and file size.
3. Inspect archives before upload. Remove unrelated or hidden files from a delivery copy; never alter the original.
4. Use a clear delivery name such as `<project>-demo.<ext>` or `<project>-portfolio.zip>` without private identifiers unless the site explicitly requires a name.
5. Prefer a short representative demo plus a verified public repository link over an oversized raw archive.
6. Compress or transcode only a delivery copy. Verify that media plays, archive paths are clean, and important text remains legible.
7. Upload once, wait for completion, and verify the displayed filename. Record the application, field, source file, delivery copy, and upload result.

Do not attach family documents, transcripts, IDs, raw chat exports, credentials, `.git` metadata, environment files, or unrelated source material in a portfolio archive. Do not upload Chinese, English, or bilingual transcripts unless explicitly required or requested. Avoid filenames or media metadata containing private contact information unless necessary.

## Repeated Sections

For education, experience, projects, awards, and family entries:

- determine count and ordering first;
- order dated education, work, internship, project, award, and publication entries reverse chronologically by end date, then start date, unless the form explicitly requires another order;
- treat parser order as untrusted and verify the final visible order;
- add one entry at a time;
- save or confirm each repeated block when possible;
- re-read all blocks after additions because indexes may shift;
- avoid duplicate records created by resume parsing.

## Browser Fallbacks

Follow [browser-control.md](browser-control.md) to select and initialize an available control route. For custom date pickers, dropdowns, or rich text fields:

- use visible labels and nearby text to identify the control;
- prefer normal UI interaction;
- use keyboard navigation when labels are inaccessible;
- verify displayed values after each unusual control;
- do not refresh merely to check whether a value saved.

When all direct-control routes are unavailable, produce a field-by-field fill sheet and ask the user only for the minimal manual clicks or missing sensitive values. Do not claim that a browser extension is working merely because it is installed or enabled; verify it with a successful page-list or snapshot operation.

When an interaction fails, first inspect the live page and error state, keep completed entries intact, and try a bounded sequence of safe alternatives such as a more specific locator, keyboard interaction, a verified fallback adapter, or a site-compatible helper. Re-read the affected field after every unusual interaction. Ask the user only when the remaining problem requires unavailable evidence, a consequential choice, credentials or verification, or unavoidable manual action.

## Repository Claims

Inspect archive listings and media filenames before writing descriptions. Link verified public repositories when supported. Do not upload large media unless the form explicitly requests a portfolio attachment and accepts the format. Do not claim that all repositories under an organization or account are student-authored; tie claimed contributions to resumes, commits, project files, or explicit user confirmation.

## Completion Gate

Before reporting completion, confirm:

- required visible fields are filled or listed as unresolved;
- resume upload status is correct;
- parsed fields were rechecked;
- repeated sections have no obvious duplicates;
- dates and metrics match the source ledger;
- portfolio files match the target role and passed privacy/format checks;
- placeholders are labeled and scoped to the application;
- declarations and sensitive fields are marked for user review;
- draft save state is visible or otherwise verified;
- no final submission or signature occurred without confirmation.
