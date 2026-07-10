import fs from "node:fs";
import path from "node:path";

export function sortReportsDescending(reports) {
  return [...reports].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function getLatestReport(reports) {
  const approved = sortReportsDescending(reports).filter((report) => report.status === "approved");
  return approved[0] ?? sortReportsDescending(reports)[0] ?? null;
}

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")));
}

export function loadReportsFromDisk(rootDirectory = process.cwd()) {
  const reports = readJsonFiles(path.join(rootDirectory, "data", "reports"));
  const drafts = readJsonFiles(path.join(rootDirectory, "data", "drafts"));
  return sortReportsDescending([...reports, ...drafts]);
}
