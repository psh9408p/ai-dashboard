import fs from "node:fs";
import path from "node:path";

export function sortReportsDescending(reports) {
  return [...reports].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function getLatestReport(reports) {
  const approved = sortReportsDescending(reports).filter((report) => report.status === "approved");
  return approved[0] ?? sortReportsDescending(reports)[0] ?? null;
}

function dateValueOf(item) {
  return item?.date ?? item?.publishedDate ?? item?.eventDate ?? null;
}

function toUtcDay(date) {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function filterItemsWithinDays(items, anchorDate, days = 7) {
  const anchor = toUtcDay(anchorDate);
  if (!anchor) return [];
  const oldest = new Date(anchor);
  oldest.setUTCDate(anchor.getUTCDate() - days);

  return items.filter((item) => {
    const itemDate = toUtcDay(dateValueOf(item));
    if (!itemDate) return false;
    return itemDate >= oldest && itemDate <= anchor;
  });
}

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")));
}

export function loadReportsFromDisk(rootDirectory = process.cwd(), options = {}) {
  const reports = readJsonFiles(path.join(rootDirectory, "data", "reports"));
  const drafts = readJsonFiles(path.join(rootDirectory, "data", "drafts"));
  const allReports = sortReportsDescending([...reports, ...drafts]);
  if (!options.withinDays) return allReports;
  const anchorDate = options.anchorDate ?? getLatestReport(allReports)?.date;
  return sortReportsDescending(filterItemsWithinDays(allReports, anchorDate, options.withinDays));
}

export function loadSourcesForDate(date, rootDirectory = process.cwd(), options = {}) {
  if (!date) return [];
  const filePath = path.join(rootDirectory, "data", "sources", `${date}.json`);
  if (!fs.existsSync(filePath)) return [];
  const sources = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const sourceItems = Array.isArray(sources) ? sources : [];
  if (!options.withinDays) return sourceItems;
  return filterItemsWithinDays(sourceItems, options.anchorDate ?? date, options.withinDays);
}
