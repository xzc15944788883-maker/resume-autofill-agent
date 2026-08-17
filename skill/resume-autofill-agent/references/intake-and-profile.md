# Intake and Profile Protocol

## First Activation

Search in this order:

1. Files attached in the current request.
2. Resume, profile, transcript, certificate, portfolio, and application files in the active workspace.
3. Authorized local profile records or memory indexes.
4. Connected read-only sources explicitly placed in scope, such as GitHub.

If a usable resume or profile is found, start immediately and ask only for blockers. If none is found, request one resume or a minimal identity/education/experience summary. Do not force a fixed questionnaire before examining the available evidence.

## Profile Sections

Maintain these logical sections when supported:

- identity and contact;
- job or program preferences;
- education and transcripts;
- internships and employment;
- projects, research, publications, and portfolio assets;
- repositories and public links;
- awards, certificates, skills, and languages;
- activities, interests, and role-specific optional material;
- family or relationship declarations only when a form explicitly requires them;
- conflicts, placeholders, unresolved questions, and privacy notes.

## Source Ledger

For every material field, retain a compact record like:

```json
{
  "field": "education[0].end_date",
  "value": "<YYYY-MM>",
  "source": "<current resume filename>",
  "source_date": "<YYYY-MM-DD or unknown>",
  "confidence": "high",
  "priority": 3,
  "status": "verified",
  "notes": "<optional>"
}
```

Use `verified`, `user_confirmed`, `conflicting`, `unknown`, and `application_placeholder` as useful statuses. A placeholder record must contain the exact rule and target application.

## Adaptive Questions

Ask only when one of these is true:

- required field has no supported value;
- two high-priority sources conflict;
- the field is sensitive or a legal/declaration field;
- the wording would materially change the claimed responsibility;
- the next action would submit, sign, consent, or create an external side effect.

Ask no more than three short questions at once. Prefer a precise statement of what is known and what remains uncertain.

## Reuse and Priority

Older resumes are low-priority evidence. Use them only when current materials are silent, the role strongly benefits, or the user explicitly requests them. Preserve the original source and label reused text as older material until confirmed.

Store reusable data only when the user authorizes memory. Keep the personal record outside this skill directory. Add an update date and source label to every new section.

## Portfolio Inventory

For each reusable work sample, capture when available:

- original local path and filename;
- artifact type, format, size, and archive contents;
- short evidence-based description;
- related project and target roles;
- recommended professional delivery filename;
- public repository or demo URL;
- owner or organization shown by the source;
- student's claimed role and supporting source;
- verification status, confidence, and last checked date;
- site-specific upload constraints or privacy risks.

Keep originals untouched. Create delivery copies only when an application requires a different name, format, size, or archive layout. Record exactly which copy was uploaded to which application.

For connected GitHub, record only `github_connector_available: true` and the public owner/repository identifiers needed for future lookup. Never record credentials. Verify repository names and descriptions through the connector or public GitHub page. Account ownership alone does not establish authorship of every repository or every line of code.
