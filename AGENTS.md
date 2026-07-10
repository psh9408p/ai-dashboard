# Agent Instructions

This file is the project-level harness for Codex and other coding agents.
Follow these rules before making changes in this repository.

## Project Summary

- Product: Korea AI bottleneck investment-monitoring dashboard.
- Runtime: Next.js static export, React, Node.js scripts.
- Automation: GitHub Actions creates daily report pull requests.
- Storage: JSON files in `config/` and `data/`; no database.
- Cost rule: keep the default operating cost at zero. Do not add paid APIs or hosted databases without explicit user approval.

## Important Paths

- `src/app/`: static dashboard UI.
- `src/lib/analysis-rules.mjs`: scoring, reliability, risk, and daily report logic.
- `src/lib/report-store.mjs`: loading and selecting reports from disk.
- `scripts/generate-daily-report.mjs`: DART and Naver API collection plus draft generation.
- `scripts/promote-draft.mjs`: converts a draft report to an approved report.
- `config/watchlist.json`: companies, tickers, DART corp codes, investment themes, and physical AI roles.
- `data/drafts/`: generated draft reports.
- `data/reports/`: approved reports displayed by the public dashboard.
- `data/sources/`: source metadata used to create reports.
- `.github/workflows/`: daily report PR and GitHub Pages deployment workflows.

## Safety Rules

- Never commit `.env.local`, API keys, GitHub tokens, browser cookies, or local credentials.
- Required secrets are `DART_API_KEY`, `NAVER_CLIENT_ID`, and `NAVER_CLIENT_SECRET`.
- Keep `.env.example` as placeholders only.
- Before pushing, scan for accidental secrets across tracked and untracked source files.
- Do not commit `node_modules`, `.next`, `out`, logs, or local cache files.
- Treat generated investment reports as informational output, not investment advice.

## Implementation Rules

- Prefer small, focused changes.
- Keep business logic in `src/lib/` and scripts in `scripts/`; keep `src/app/` mostly presentational.
- Preserve the JSON interfaces used by reports unless you update tests and UI together.
- Use official APIs and stable metadata over brittle HTML scraping when possible.
- If adding a new data provider, isolate it behind a small collector function and keep failure behavior graceful.
- If a provider fails or an API key is missing, generate a conservative report with `judgment hold` / no major change rather than inventing conclusions.
- Do not add LLM-generated daily analysis unless the user explicitly accepts API cost.

## Testing And Verification

Run these before claiming completion:

```powershell
npm.cmd test
npm.cmd run build
```

For collector changes, also run:

```powershell
npm.cmd run generate:draft
```

Verify that generated files do not contain secrets before committing.

## Git Workflow

- Main branch: `main`.
- Commit only reviewed source/config/data changes.
- After changes that affect GitHub Actions, inspect `.github/workflows/` carefully before pushing.
- Push to `origin main` only after tests and build pass.
