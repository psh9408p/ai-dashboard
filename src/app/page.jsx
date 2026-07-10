import { loadReportsFromDisk, getLatestReport } from "../lib/report-store.mjs";
import fs from "node:fs";
import path from "node:path";

function loadWatchlist() {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "config", "watchlist.json"), "utf8"));
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Section({ title, children }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children = "표시할 데이터가 없습니다." }) {
  return <p className="empty">{children}</p>;
}

function statusTone(status) {
  if (status === "강화" || status === "상향" || status === "긍정") return "good";
  if (status === "약화" || status === "하향" || status === "부정") return "bad";
  if (status === "판단 보류" || status === "관찰 필요") return "watch";
  return "neutral";
}

function ReportSummary({ report }) {
  const summary = report.finalSummary ?? {};
  return (
    <div className="summaryGrid">
      <div>
        <span>오늘 투자 논리를 강화한 사건</span>
        <strong>{summary.strengthened ?? "중대한 변화 없음"}</strong>
      </div>
      <div>
        <span>오늘 투자 논리를 약화한 사건</span>
        <strong>{summary.weakened ?? "중대한 변화 없음"}</strong>
      </div>
      <div>
        <span>가장 주목할 기업</span>
        <strong>{summary.mostNotable ?? "관찰 필요"}</strong>
      </div>
      <div>
        <span>과열 또는 기대 선반영 주의 기업</span>
        <strong>{summary.overheated ?? "판단 보류"}</strong>
      </div>
      <div>
        <span>추가 매수보다 관찰이 필요한 기업</span>
        <strong>{summary.watchMore ?? "관찰 필요"}</strong>
      </div>
      <div>
        <span>기존 관찰 대상 제외 검토</span>
        <strong>{summary.removalReview ?? "없음"}</strong>
      </div>
    </div>
  );
}

function KeyChanges({ changes }) {
  if (!changes?.length) return <Empty />;
  return (
    <div className="changeList">
      {changes.map((change, index) => (
        <article className="changeItem" key={`${change.event}-${index}`}>
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

function StockTable({ rows }) {
  if (!rows?.length) return <Empty>아직 종목별 자동 판정 데이터가 없습니다.</Empty>;
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>종목</th>
            <th>핵심 병목 또는 역할</th>
            <th>오늘의 변화</th>
            <th>투자 논리 상태</th>
            <th>밸류에이션 부담</th>
            <th>관심도 변화</th>
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
    <div className="priorityBlock">
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
        <Empty>선정할 만큼 강한 근거가 아직 없습니다.</Empty>
      )}
    </div>
  );
}

export default function Home() {
  const reports = loadReportsFromDisk();
  const latest = getLatestReport(reports);
  const watchlist = loadWatchlist();

  if (!latest) {
    return (
      <main className="page">
        <h1>한국 AI 산업 병목 투자현황</h1>
        <Empty>아직 생성된 리포트가 없습니다. GitHub Actions에서 초안 생성을 실행하세요.</Empty>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Korea AI Bottleneck Monitor</p>
          <h1>한국 AI·산업 병목 투자현황</h1>
          <p>
            DART 공시, 뉴스 검색, 공개 데이터로 매일 투자 논리를 점검하고 PR 승인 후 확정 리포트로
            게시합니다.
          </p>
        </div>
        <div className="heroMeta">
          <Badge tone={latest.status === "approved" ? "good" : "watch"}>{latest.status}</Badge>
          <strong>{latest.date}</strong>
          <span>관찰 종목 {watchlist.length}개</span>
        </div>
      </header>

      <p className="disclaimer">{latest.disclaimer}</p>

      <Section title="최종 요약">
        <ReportSummary report={latest} />
      </Section>

      <Section title="오늘의 핵심 변화">
        <KeyChanges changes={latest.keyChanges} />
      </Section>

      <Section title="종목별 상태 변화">
        <StockTable rows={latest.stockTable} />
      </Section>

      <Section title="오늘의 우선순위">
        <div className="priorityGrid">
          <PriorityList title="병목 경쟁력" rows={latest.priorityTop5?.bottleneck} />
          <PriorityList title="피지컬 AI 실현 가능성" rows={latest.priorityTop5?.physicalAi} />
          <PriorityList title="가격 고려 투자 매력" rows={latest.priorityTop5?.attractivePrice} />
        </div>
      </Section>

      <Section title="투자 논리를 깨뜨릴 수 있는 위험">
        <div className="riskGrid">
          {latest.riskReview?.map((risk) => (
            <article className="riskItem" key={risk.risk}>
              <Badge tone={statusTone(risk.status)}>{risk.status}</Badge>
              <h3>{risk.risk}</h3>
              <p>영향 종목: {risk.affectedCompanies?.length ? risk.affectedCompanies.join(", ") : "판단 보류"}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="과거 리포트">
        <div className="history">
          {reports.map((report) => (
            <span key={`${report.status}-${report.date}`}>
              {report.date} <Badge tone={report.status === "approved" ? "good" : "watch"}>{report.status}</Badge>
            </span>
          ))}
        </div>
      </Section>
    </main>
  );
}
