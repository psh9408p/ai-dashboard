import fs from "node:fs";
import path from "node:path";
import { getLatestReport, loadReportsFromDisk, loadSourcesForDate } from "../lib/report-store.mjs";

const DISPLAY_WINDOW_DAYS = 7;

function loadWatchlist() {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "config", "watchlist.json"), "utf8"));
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Section({ title, kicker, children }) {
  return (
    <section className="section">
      <div className="sectionHeader">
        {kicker ? <p className="sectionKicker">{kicker}</p> : null}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Empty({ children = "No data available." }) {
  return <p className="empty">{children}</p>;
}

function statusTone(status) {
  if (["강화", "상향", "긍정", "approved"].includes(status)) return "good";
  if (["약화", "하향", "부정"].includes(status)) return "bad";
  if (["판단 보류", "관찰 필요", "draft"].includes(status)) return "watch";
  return "neutral";
}

function ReportSummary({ report }) {
  const summary = report.finalSummary ?? {};
  const cards = [
    ["Strengthened thesis", summary.strengthened ?? "No major change"],
    ["Weakened thesis", summary.weakened ?? "No major change"],
    ["Most notable company", summary.mostNotable ?? "Watch required"],
    ["Overheated / priced-in", summary.overheated ?? "Judgment hold"],
    ["Needs observation", summary.watchMore ?? "Watch required"],
    ["Removal review", summary.removalReview ?? "None"],
  ];

  return (
    <div className="summaryGrid">
      {cards.map(([label, value]) => (
        <div className="surfaceBlock" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function KeyChanges({ changes }) {
  if (!changes?.length) return <Empty />;
  return (
    <div className="changeList">
      {changes.map((change, index) => (
        <article className="changeItem surfaceBlock" key={`${change.event}-${index}`}>
          <div className="changeMeta">
            <Badge tone={statusTone(change.judgment)}>{change.judgment}</Badge>
            <Badge>{change.horizon}</Badge>
            <span>{change.eventDate}</span>
          </div>
          <h3>{change.event}</h3>
          <p>{change.impact}</p>
        </article>
      ))}
    </div>
  );
}

function sortNotableSources(sources, report) {
  const highlightedIds = new Set(report.keyChanges?.flatMap((change) => change.sourceIds ?? []) ?? []);
  return [...sources]
    .sort((a, b) => {
      const highlightedDelta = Number(highlightedIds.has(b.id)) - Number(highlightedIds.has(a.id));
      if (highlightedDelta !== 0) return highlightedDelta;
      return String(b.publishedDate ?? b.eventDate ?? "").localeCompare(String(a.publishedDate ?? a.eventDate ?? ""));
    })
    .slice(0, 10);
}

function NotableSources({ sources, report }) {
  const notable = sortNotableSources(sources, report);
  if (!notable.length) {
    return <Empty>No crawled source metadata is available within the seven-day display window.</Empty>;
  }

  return (
    <div className="sourceGrid">
      {notable.map((source) => (
        <article className="sourceItem surfaceBlock" key={source.id}>
          <div className="changeMeta">
            <Badge tone={source.sourceType === "disclosure" ? "good" : "neutral"}>{source.sourceType}</Badge>
            <Badge tone={source.reliability === "low" ? "watch" : "neutral"}>{source.reliability ?? "unknown"}</Badge>
            <span>{source.publishedDate ?? source.eventDate ?? report.date}</span>
          </div>
          <h3>{source.title}</h3>
          {source.summary ? <p className="sourceSummary">{source.summary}</p> : null}
          <a className="sourceLink" href={source.url} target="_blank" rel="noreferrer">
            Open source
          </a>
        </article>
      ))}
    </div>
  );
}

function StockTable({ rows }) {
  if (!rows?.length) return <Empty>No stock status data is available yet.</Empty>;
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Core bottleneck or role</th>
            <th>Today change</th>
            <th>Thesis status</th>
            <th>Valuation burden</th>
            <th>Interest change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.companyId}>
              <td>{row.companyName}</td>
              <td>{row.coreRole}</td>
              <td>{row.todayChange}</td>
              <td>
                <Badge tone={statusTone(row.investmentStatus)}>{row.investmentStatus}</Badge>
              </td>
              <td>{row.valuationBurden}</td>
              <td>
                <Badge tone={statusTone(row.interestChange)}>{row.interestChange}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PriorityList({ title, rows }) {
  return (
    <div className="priorityBlock surfaceBlock">
      <h3>{title}</h3>
      {rows?.length ? (
        <ol>
          {rows.map((row) => (
            <li key={`${title}-${row.companyId}`}>
              <strong>{row.companyName}</strong>
              <span>{row.todayChange}</span>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>There is not enough verified evidence to rank companies.</Empty>
      )}
    </div>
  );
}

export default function Home() {
  const allReports = loadReportsFromDisk();
  const latest = getLatestReport(allReports);
  const reports = loadReportsFromDisk(process.cwd(), {
    anchorDate: latest?.date,
    withinDays: DISPLAY_WINDOW_DAYS,
  });
  const watchlist = loadWatchlist();
  const sources = loadSourcesForDate(latest?.date, process.cwd(), {
    anchorDate: latest?.date,
    withinDays: DISPLAY_WINDOW_DAYS,
  });

  if (!latest) {
    return (
      <main className="page">
        <h1>Korea AI Bottleneck Monitor</h1>
        <Empty>No report has been generated yet. Run the daily report workflow.</Empty>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Montage-inspired monitoring system</p>
          <h1>Korea AI and Industrial Bottleneck Dashboard</h1>
          <p>
            Daily disclosure and news collection, conservative rule-based scoring, and PR approval before publication.
          </p>
        </div>
        <div className="heroMeta surfaceBlock">
          <Badge tone={statusTone(latest.status)}>{latest.status}</Badge>
          <strong>{latest.date}</strong>
          <span>{watchlist.length} tracked companies</span>
          <span>Showing sources from the last {DISPLAY_WINDOW_DAYS} days</span>
        </div>
      </header>

      <p className="disclaimer">{latest.disclaimer}</p>

      <Section title="Final Summary" kicker="Thesis validation">
        <ReportSummary report={latest} />
      </Section>

      <Section title="Key Changes Today" kicker="Verified signal priority">
        <KeyChanges changes={latest.keyChanges} />
      </Section>

      <Section title="Notable Crawled Sources" kicker={`Only sources within ${DISPLAY_WINDOW_DAYS} days are displayed`}>
        <NotableSources sources={sources} report={latest} />
      </Section>

      <Section title="Company Status Table" kicker="Bottleneck and valuation view">
        <StockTable rows={latest.stockTable} />
      </Section>

      <Section title="Priority Watchlist" kicker="Rule-based ranking">
        <div className="priorityGrid">
          <PriorityList title="Strongest bottleneck" rows={latest.priorityTop5?.bottleneck} />
          <PriorityList title="Physical AI potential" rows={latest.priorityTop5?.physicalAi} />
          <PriorityList title="Price-aware attractiveness" rows={latest.priorityTop5?.attractivePrice} />
        </div>
      </Section>

      <Section title="Risks That Can Break The Thesis" kicker="Counter-evidence check">
        <div className="riskGrid">
          {latest.riskReview?.map((risk) => (
            <article className="riskItem surfaceBlock" key={risk.risk}>
              <Badge tone={statusTone(risk.status)}>{risk.status}</Badge>
              <h3>{risk.risk}</h3>
              <p>Affected companies: {risk.affectedCompanies?.length ? risk.affectedCompanies.join(", ") : "Judgment hold"}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Report History" kicker={`Last ${DISPLAY_WINDOW_DAYS} days`}>
        <div className="history">
          {reports.map((report) => (
            <span key={`${report.status}-${report.date}`}>
              {report.date} <Badge tone={statusTone(report.status)}>{report.status}</Badge>
            </span>
          ))}
        </div>
      </Section>
    </main>
  );
}
