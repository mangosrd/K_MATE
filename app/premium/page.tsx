import type { Metadata } from "next";
import PremiumView from "./PremiumView";

export const metadata: Metadata = {
  title: "K-MATE 프리미엄 — 모든 메이트와 함께",
  description: "프리미엄으로 업그레이드하면 선우·상우·용우와 함께 더 넓은 한국을 여행할 수 있어요.",
};

export default function PremiumPage() {
  return <PremiumView />;
}
