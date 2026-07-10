import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportDate = process.env.REPORT_DATE || getKoreanDate();
const draftPath = path.join(root, "data", "drafts", `${reportDate}.json`);
const reportPath = path.join(root, "data", "reports", `${reportDate}.json`);

function getKoreanDate() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

if (!fs.existsSync(draftPath)) {
  throw new Error(`Draft not found: ${draftPath}`);
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
const report = JSON.parse(fs.readFileSync(draftPath, "utf8"));
report.status = "approved";
report.approvedAt = new Date().toISOString();
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Promoted ${reportDate} draft to approved report`);
