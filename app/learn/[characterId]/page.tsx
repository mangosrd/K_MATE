import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import BottomNav from "@/components/ui/BottomNav";
import { getCharacterById, getChaptersForCharacter, MOCK_ALL_PROGRESS, canAccessCharacter, MOCK_USER } from "@/lib/db/mock";
import LearnView from "./LearnView";
import LockedNotice from "./LockedNotice";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function generateMetadata({ params }: { params: Promise<{ characterId: string }> }): Promise<Metadata> {
  const { characterId } = await params;
  const char = getCharacterById(characterId);
  return { title: `${char?.name ?? ""}와 공부하기 — K-MATE` };
}

export default async function LearnPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params;
  const char = getCharacterById(characterId);
  if (!char) notFound();

  // 로그인 유저면 쿠키로 실제 계정 id를 알 수 있음 — 서버에서 실제 멤버십을 확인한다.
  const cookieStore = await cookies();
  const userId = cookieStore.get("kmate_uid")?.value ?? MOCK_USER.id;
  let membership: string = MOCK_USER.membership;
  try {
    const res = await fetch(`${BACKEND_URL}/user/${userId}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      membership = data.membership;
    }
  } catch {
    // 백엔드 미연결 — 목업 멤버십으로 폴백
  }

  const canAccess = canAccessCharacter(characterId, membership, MOCK_USER.free_character_slots);
  if (!canAccess) {
    return (
      <>
        <LockedNotice charName={char.name} />
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
