import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { getLatestReport, loadSourcesForDate, sortReportsDescending } from "../src/lib/report-store.mjs";

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

test("loads source metadata for a report date", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "report-store-"));
  const sourcesDirectory = path.join(root, "data", "sources");
  fs.mkdirSync(sourcesDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(sourcesDirectory, "2026-07-10.json"),
    JSON.stringify([{ id: "source-1", title: "sample source" }]),
  );

  const sources = loadSourcesForDate("2026-07-10", root);

  assert.equal(sources.length, 1);
  assert.equal(sources[0].id, "source-1");
});
