const HIGH_VALUE_KEYWORDS = [
  "공급계약",
  "수주",
  "실적",
  "매출",
  "영업이익",
  "양산",
  "인증",
  "증설",
  "착공",
  "준공",
  "정책",
  "승인",
  "공시",
];

const PROMO_KEYWORDS = ["비전", "전망", "계획", "기대", "소개", "선도", "혁신", "미래"];
const RUMOR_KEYWORDS = ["루머", "소문", "수주설", "관측", "추정", "미확인", "확인되지"];
const NEGATIVE_KEYWORDS = ["지연", "취소", "감소", "하향", "적자", "공급과잉", "둔화", "제재"];

function textOf(source) {
  return `${source.title ?? ""} ${source.summary ?? ""}`.toLowerCase();
}

export function classifyReliability(source) {
  const text = textOf(source);
  if (RUMOR_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()))) {
    return "low";
  }
  if (source.sourceType === "disclosure" || source.sourceType === "official") {
    return "high";
  }
  if (source.sourceType === "government") {
    return "high";
  }
  return "medium";
}

export function scoreSource(source) {
  const text = textOf(source);
  const reliability = classifyReliability(source);
  let score = reliability === "high" ? 6 : reliability === "medium" ? 3 : 0;

  for (const keyword of HIGH_VALUE_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) score += 3;
  }
  for (const keyword of PROMO_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) score -= 1;
  }
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) score += 2;
  }

  const hasNegative = NEGATIVE_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
  const hasVerifiedPositive = HIGH_VALUE_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
  const hasLongTermClaim = PROMO_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));

  return {
    ...source,
    reliability,
    score: Math.max(0, score),
    sentiment: reliability === "low" ? "중립" : hasNegative ? "부정" : hasVerifiedPositive ? "긍정" : "중립",
    horizon: hasVerifiedPositive || hasLongTermClaim ? "장기 경쟁력 변화" : "단기 주가 재료",
    statusSignal: reliability === "low" ? "판단 보류" : hasNegative ? "약화" : hasVerifiedPositive ? "강화" : "유지",
  };
}

function normalizeTitle(title) {
  return String(title ?? "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase();
}

export function dedupeSources(sources) {
  const seen = new Set();
  return sources.filter((source) => {
    const key = normalizeTitle(source.title) || source.url || source.id;
    const canonicalUrl = source.url ? String(source.url).split("?")[0] : "";
    const compoundKey = `${key}:${canonicalUrl}`;
    if (seen.has(key) || seen.has(compoundKey)) return false;
    seen.add(key);
    seen.add(compoundKey);
    return true;
  });
}

export function summarizeCompanyStatus({ company, sources, stock }) {
  const scored = dedupeSources(sources).map(scoreSource).sort((a, b) => b.score - a.score);
  const top = scored[0];

  if (!top || top.score < 5) {
    return {
      companyId: company.id,
      companyName: company.name,
      coreRole: company.themes?.join(", ") ?? "관찰 대상",
      todayChange: "중대한 변화 없음",
      investmentStatus: "유지",
      valuationBurden: stock?.valuationBurden ?? "판단 보류",
      interestChange: "유지",
      topSourceIds: [],
    };
  }

  return {
    companyId: company.id,
    companyName: company.name,
    coreRole: company.themes?.join(", ") ?? "관찰 대상",
    todayChange: top.title,
    investmentStatus: top.statusSignal,
    valuationBurden: stock?.valuationBurden ?? "판단 보류",
    interestChange: top.statusSignal === "강화" ? "상향" : top.statusSignal === "약화" ? "하향" : "관찰 필요",
    topSourceIds: [top.id],
  };
}

export function buildDailyReport({ date, companies, sources, stocks = [], status = "draft" }) {
  const uniqueSources = dedupeSources(sources);
  const scoredSources = uniqueSources.map(scoreSource).sort((a, b) => b.score - a.score);
  const stockByCompany = new Map(stocks.map((stock) => [stock.companyId, stock]));

  const stockTable = companies.map((company) =>
    summarizeCompanyStatus({
      company,
      sources: scoredSources.filter((source) => source.companyIds?.includes(company.id)),
      stock: stockByCompany.get(company.id) ?? null,
    }),
  );

  const keyChanges = scoredSources
    .filter((source) => source.score >= 8)
    .slice(0, 8)
    .map((source) => ({
      relatedCompanies: source.companyIds ?? [],
      event: source.title,
      eventDate: source.eventDate ?? source.publishedDate ?? date,
      impact: source.summary || "검증 가능한 원문을 확인해야 합니다.",
      judgment: source.sentiment,
      horizon: source.horizon,
      sourceIds: [source.id],
    }));

  return {
    date,
    status,
    generatedAt: new Date().toISOString(),
    disclaimer: "이 리포트는 투자 권유가 아니라 정보 확인과 투자 논리 검증을 위한 자동 초안입니다.",
    keyChanges: keyChanges.length
      ? keyChanges
      : [
          {
            relatedCompanies: [],
            event: "중대한 변화 없음",
            eventDate: date,
            impact: "무료 공개 데이터 기준으로 기존 투자 논리를 바꿀 만한 검증된 변화가 발견되지 않았습니다.",
            judgment: "중립",
            horizon: "장기 경쟁력 변화",
            sourceIds: [],
          },
        ],
    bottleneckScores: companies.map((company) => ({
      companyId: company.id,
      companyName: company.name,
      grade: stockTable.find((row) => row.companyId === company.id)?.investmentStatus ?? "유지",
      rationale: "공시, 뉴스, 공개 가격 데이터를 기준으로 규칙형 점수화했습니다.",
    })),
    physicalAiReview: {
      operators: companies
        .filter((company) => company.physicalAiRole === "operator")
        .map((company) => ({ companyId: company.id, companyName: company.name, status: "관찰 필요" })),
      enablers: companies
        .filter((company) => company.physicalAiRole === "enabler")
        .map((company) => ({ companyId: company.id, companyName: company.name, status: "관찰 필요" })),
    },
    stockTable,
    valuationChecks: stocks,
    priorityTop5: {
      bottleneck: stockTable.filter((row) => row.investmentStatus === "강화").slice(0, 5),
      physicalAi: stockTable
        .filter((row) => companies.find((company) => company.id === row.companyId)?.physicalAiRole)
        .slice(0, 5),
      attractivePrice: stockTable.filter((row) => row.valuationBurden !== "높음").slice(0, 5),
    },
    riskReview: [
      {
        risk: "HBM 공급과잉",
        status: scoredSources.some((source) => textOf(source).includes("공급과잉")) ? "커짐" : "중대한 변화 없음",
        affectedCompanies: companies.filter((company) => company.themes?.includes("AI 반도체 병목")).map((company) => company.id),
      },
      {
        risk: "AI 데이터센터 투자 둔화",
        status: scoredSources.some((source) => textOf(source).includes("둔화")) ? "커짐" : "중대한 변화 없음",
        affectedCompanies: companies.map((company) => company.id),
      },
      {
        risk: "로봇 실증이 매출로 이어지지 않는 문제",
        status: "관찰 필요",
        affectedCompanies: companies.filter((company) => company.physicalAiRole).map((company) => company.id),
      },
    ],
    finalSummary: {
      strengthened: keyChanges[0]?.event ?? "중대한 변화 없음",
      weakened: scoredSources.find((source) => source.sentiment === "부정")?.title ?? "중대한 변화 없음",
      mostNotable: stockTable.find((row) => row.interestChange === "상향")?.companyName ?? "관찰 필요",
      overheated: stockTable.find((row) => row.valuationBurden === "높음")?.companyName ?? "판단 보류",
      watchMore: stockTable.find((row) => row.interestChange === "관찰 필요")?.companyName ?? "중대한 변화 없음",
      newlyAdded: "없음",
      removalReview: "없음",
    },
    sourceIds: scoredSources.map((source) => source.id),
  };
}
