import assert from "node:assert/strict";
import test from "node:test";

import { getLatestReport, sortReportsDescending } from "../src/lib/report-store.mjs";

test("sorts reports by date descending", () => {
  const reports = sortReportsDescending([
    { date: "2026-07-08", status: "approved" },
    { date: "2026-07-10", status: "approved" },
    { date: "2026-07-09", status: "draft" },
  ]);

  assert.deepEqual(
    reports.map((report) => report.date),
    ["2026-07-10", "2026-07-09", "2026-07-08"],
  );
});

test("prefers latest approved report over drafts for the public dashboard", () => {
  const latest = getLatestReport([
    { date: "2026-07-10", status: "draft" },
    { date: "2026-07-09", status: "approved" },
  ]);

  assert.equal(latest.date, "2026-07-09");
  assert.equal(latest.status, "approved");
});
