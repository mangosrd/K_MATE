import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import { getCharacterById, getChaptersForCharacter, MOCK_ALL_PROGRESS, canAccessCharacter, MOCK_USER } from "@/lib/db/mock";
import LearnView from "./LearnView";

export async function generateMetadata({ params }: { params: Promise<{ characterId: string }> }): Promise<Metadata> {
  const { characterId } = await params;
  const char = getCharacterById(characterId);
  return { title: `${char?.name ?? ""}와 공부하기 — K-MATE` };
}

export default async function LearnPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params;
  const char = getCharacterById(characterId);
  if (!char) notFound();

  const canAccess = canAccessCharacter(characterId, MOCK_USER.membership, MOCK_USER.free_character_slots);
  if (!canAccess) {
    return (
      <>
        <div className="page-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>{char.name} 기장 학습 잠금</h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px", maxWidth: "300px" }}>
            이 노선의 학습은 프리미엄 전용입니다. 구독 후 이용해 주세요.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/map" className="btn btn-secondary">← 지도로 돌아가기</Link>
            <Link href="/premium" className="btn btn-gold">⭐ 프리미엄 보기</Link>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  const chapters = getChaptersForCharacter(characterId);
  const progress = MOCK_ALL_PROGRESS[characterId];
  const currentStep = progress?.current_step ?? 1;

  return (
    <>
      <LearnView char={char} chapters={chapters} currentStep={currentStep} />
      <BottomNav />
    </>
  );
}
