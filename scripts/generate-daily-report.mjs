import fs from "node:fs";
import path from "node:path";
import { buildDailyReport } from "../src/lib/analysis-rules.mjs";

const root = process.cwd();
const today = process.env.REPORT_DATE || getKoreanDate();

function getKoreanDate() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function stripHtml(value) {
  return String(value ?? "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

async function fetchDartDisclosures(company) {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey || !company.dartCorpCode) return [];

  const url = new URL("https://opendart.fss.or.kr/api/list.json");
  url.searchParams.set("crtfc_key", apiKey);
  url.searchParams.set("corp_code", company.dartCorpCode);
  url.searchParams.set("bgn_de", today.replaceAll("-", ""));
  url.searchParams.set("end_de", today.replaceAll("-", ""));
  url.searchParams.set("page_count", "20");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`DART ${company.name} ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.list)) return [];

  return payload.list.map((item) => ({
    id: `dart-${company.id}-${item.rcept_no}`,
    companyIds: [company.id],
    sourceType: "disclosure",
    title: item.report_nm,
    url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
    publishedDate: item.rcept_dt?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") ?? today,
    eventDate: item.rcept_dt?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") ?? today,
    publisher: "DART",
    reliability: "high",
    summary: `${company.name} 공시: ${item.report_nm}`,
  }));
}

async function fetchNaverNews(company) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const query = `${company.name} AI 반도체 전력 로봇 수주 공시 실적`;
  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "10");
  url.searchParams.set("sort", "date");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });
  if (!response.ok) throw new Error(`Naver ${company.name} ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.items)) return [];

  return payload.items.map((item, index) => ({
    id: `naver-${company.id}-${today}-${index}`,
    companyIds: [company.id],
    sourceType: "news",
    title: stripHtml(item.title),
    url: item.originallink || item.link,
    publishedDate: item.pubDate ? new Date(item.pubDate).toISOString().slice(0, 10) : today,
    eventDate: item.pubDate ? new Date(item.pubDate).toISOString().slice(0, 10) : today,
    publisher: "Naver News Search",
    reliability: "medium",
    summary: stripHtml(item.description),
  }));
}

async function collectSources(companies) {
  const allSources = [];
  const errors = [];

  for (const company of companies) {
    try {
      allSources.push(...(await fetchDartDisclosures(company)));
    } catch (error) {
      errors.push({ companyId: company.id, source: "DART", message: error.message });
    }

    try {
      allSources.push(...(await fetchNaverNews(company)));
    } catch (error) {
      errors.push({ companyId: company.id, source: "Naver", message: error.message });
    }
  }

  return { allSources, errors };
}

function buildStocks(companies) {
  return companies.map((company) => ({
    companyId: company.id,
    companyName: company.name,
    ticker: company.ticker,
    currentPrice: null,
    dayChangePercent: null,
    oneMonth: "판단 보류",
    threeMonths: "판단 보류",
    oneYear: "판단 보류",
    per: null,
    pbr: null,
    evEbitda: null,
    valuationBurden: "판단 보류",
    note: "무료 공개 데이터에서 안정적으로 확인되는 범위만 표시합니다. 자동 가격 연동은 후속 API 어댑터에서 교체 가능합니다.",
  }));
}

const companies = readJson(path.join(root, "config", "watchlist.json"));
const { allSources, errors } = await collectSources(companies);
const stocks = buildStocks(companies);
const report = buildDailyReport({ date: today, companies, sources: allSources, stocks, status: "draft" });
report.collectionErrors = errors;

ensureDirectory(path.join(root, "data", "drafts"));
ensureDirectory(path.join(root, "data", "sources"));

fs.writeFileSync(path.join(root, "data", "drafts", `${today}.json`), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(root, "data", "sources", `${today}.json`), `${JSON.stringify(allSources, null, 2)}\n`);

console.log(`Generated draft report for ${today}`);
console.log(`Sources: ${allSources.length}`);
console.log(`Collection errors: ${errors.length}`);
