# Project Skills Guide

Use this guide to choose the right working mode for future agents.

## Required Habits

- Use systematic debugging for runtime errors, broken workflows, failed builds, or unexpected report output.
- Use test-first changes for scoring rules, report selection logic, and source normalization.
- Use verification before completion: no success claim without a fresh command result.
- Use a short implementation plan before broad changes to data contracts, workflows, or the dashboard layout.

## Domain Skills

### Data Collection

- Prefer API collection in this order:
  1. DART disclosures.
  2. Naver News Search API.
  3. Company official IR/news pages.
  4. Government or exchange sources.
- Avoid broad scraping until an API or stable feed is unavailable.
- Always store source metadata with title, URL, publisher, published date, event date, company IDs, and source type.

### Analysis Rules

- Give high weight to disclosures, contracts, orders, production, certification, earnings, and capacity expansion.
- Give low weight to promotional articles, repeated plans, and theme-only stock movement.
- Mark rumor language as low reliability and judgment hold.
- Separate company quality from current price attractiveness.

### Dashboard UI

- Keep the first screen an operational dashboard, not a marketing landing page.
- Make badges and tables readable on desktop and mobile.
- Avoid adding user-facing text that promises investment returns.
- Preserve the disclaimer that the output is for information checking and thesis validation only.

### Automation

- Daily automation should create a pull request, not silently publish unreviewed results.
- GitHub Actions must read secrets only from repository secrets.
- If Actions fail because a key is missing, the failure should be visible and easy to diagnose.

## Useful Commands

```powershell
npm.cmd install
npm.cmd test
npm.cmd run generate:draft
npm.cmd run promote:draft
npm.cmd run build
git status --short
```

