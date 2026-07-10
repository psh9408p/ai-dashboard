import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyReliability,
  dedupeSources,
  scoreSource,
  summarizeCompanyStatus,
} from "../src/lib/analysis-rules.mjs";

test("scores verified contracts and orders above promotional articles", () => {
  const contract = scoreSource({
    sourceType: "disclosure",
    title: "SK하이닉스 HBM 공급계약 체결 및 양산 확대",
    summary: "고객 인증 이후 실제 공급계약과 양산 일정이 공시됐다.",
  });

  const promo = scoreSource({
    sourceType: "news",
    title: "삼성전자 AI 미래 비전 소개",
    summary: "회사가 장기 계획과 기대감을 반복 설명했다.",
  });

  assert.ok(contract.score > promo.score);
  assert.equal(contract.sentiment, "긍정");
  assert.equal(promo.horizon, "장기 경쟁력 변화");
});

test("marks rumor language as low reliability and judgment hold", () => {
  const reliability = classifyReliability({
    sourceType: "news",
    title: "한미반도체 대형 고객 수주설 확산",
    summary: "시장에서는 확인되지 않은 루머라는 평가도 있다.",
  });

  assert.equal(reliability, "low");

  const scored = scoreSource({
    sourceType: "news",
    title: "한미반도체 대형 고객 수주설 확산",
    summary: "시장에서는 확인되지 않은 루머라는 평가도 있다.",
  });

  assert.equal(scored.sentiment, "중립");
  assert.equal(scored.statusSignal, "판단 보류");
});

test("deduplicates repeated news by normalized title and url", () => {
  const sources = dedupeSources([
    {
      id: "a",
      title: "HD현대일렉트릭, 초고압 변압기 수주",
      url: "https://example.com/a",
    },
    {
      id: "b",
      title: "HD현대일렉트릭 초고압 변압기 수주",
      url: "https://example.com/b",
    },
    {
      id: "c",
      title: "HD현대일렉트릭, 초고압 변압기 수주",
      url: "https://example.com/a",
    },
  ]);

  assert.equal(sources.length, 1);
  assert.equal(sources[0].id, "a");
});

test("returns no major change when a company has no meaningful source", () => {
  const result = summarizeCompanyStatus({
    company: { id: "hyundai-mobis", name: "현대모비스", themes: ["physical-ai"] },
    sources: [],
    stock: null,
  });

  assert.equal(result.todayChange, "중대한 변화 없음");
  assert.equal(result.investmentStatus, "유지");
  assert.equal(result.interestChange, "유지");
});
