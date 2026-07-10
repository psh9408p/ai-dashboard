# Copilot Instructions

This repository is a zero-cost, static Next.js dashboard for monitoring Korean AI and industrial bottleneck investment signals.

- Keep secrets out of commits. `.env.local` must remain local only.
- Keep report logic in `src/lib/analysis-rules.mjs`.
- Keep disk loading logic in `src/lib/report-store.mjs`.
- Keep data collectors in `scripts/generate-daily-report.mjs`.
- Use JSON files as the storage layer; do not add a database by default.
- Run `npm.cmd test` and `npm.cmd run build` before finalizing changes.
- Prefer conservative output such as `judgment hold` or `no major change` when evidence is incomplete.

