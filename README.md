# 한국 AI 산업 병목 투자현황 대시보드

무료 공개 데이터로 한국 AI·산업 병목 투자 논리를 매일 점검하는 정적 대시보드입니다. GitHub Actions가 매일 초안 리포트 PR을 만들고, 사용자가 PR을 검토해 merge하면 GitHub Pages에 확정 리포트가 게시됩니다.

## 운영 방식

1. GitHub 저장소 Settings > Secrets and variables > Actions에 무료 API 키를 등록합니다.
   - `DART_API_KEY`
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`
2. GitHub Pages source를 GitHub Actions로 설정합니다.
3. `Daily investment report draft` 워크플로가 한국 시간 오전 7시 30분에 실행됩니다.
4. 생성된 PR에서 `data/drafts/YYYY-MM-DD.json`, `data/reports/YYYY-MM-DD.json`, `data/sources/YYYY-MM-DD.json`를 확인합니다.
5. 내용이 적절하면 PR을 merge합니다. merge 후 `Deploy dashboard to GitHub Pages`가 정적 대시보드를 배포합니다.

## 로컬 명령

```bash
npm install
npm test
npm run generate:draft
npm run promote:draft
npm run build
```

PowerShell 실행 정책 때문에 `npm`이 막히면 Windows에서는 `npm.cmd test`처럼 `.cmd` 실행 파일을 사용하세요.

## 데이터 구조

- `config/watchlist.json`: 관찰 기업, 티커, DART corp code, 투자 축, 피지컬 AI 역할
- `data/drafts/YYYY-MM-DD.json`: 자동 생성 초안
- `data/reports/YYYY-MM-DD.json`: 승인된 공개 리포트
- `data/sources/YYYY-MM-DD.json`: 공시·뉴스 원문 메타데이터

## 주의

이 도구는 투자 권유가 아니라 정보 확인과 투자 논리 검증을 위한 자동화 도구입니다. 무료 공개 데이터 한계 때문에 밸류에이션, 증권사 전망, 실시간 주가 항목은 불완전할 수 있으며, 확인이 부족한 항목은 판단 보류로 표시합니다.
