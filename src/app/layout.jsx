import "./globals.css";

export const metadata = {
  title: "한국 AI 산업 병목 투자현황",
  description: "무료 공개 데이터 기반 한국 AI·산업 병목 투자 논리 검증 대시보드",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
