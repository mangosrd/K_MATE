import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import BottomNav from "@/components/ui/BottomNav";
import { getCharacterById, getChaptersForCharacter, canAccessCharacter } from "@/lib/db/mock";
import LearnView from "./LearnView";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function generateMetadata({ params }: { params: Promise<{ characterId: string }> }): Promise<Metadata> {
  const { characterId } = await params;
  const char = getCharacterById(characterId);
  return { title: `${char?.name ?? ""}와 공부하기 — K-MATE` };
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ characterId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { characterId } = await params;
  const { tab } = await searchParams;
  const char = getCharacterById(characterId);
  if (!char) notFound();

  // 로그인 유저면 쿠키로 실제 계정 id를 알 수 있음 — 서버에서 실제 멤버십/무료 슬롯을 확인한다.
  const cookieStore = await cookies();
  const userId = cookieStore.get("kmate_uid")?.value;
  const accessToken = cookieStore.get("kmate_access_token")?.value;
  let membership = "free";
  let freeCharSlots: string[] = [];
  if (userId && accessToken) try {
    const res = await fetch(`${BACKEND_URL}/user/${userId}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      membership = data.membership;
      // 실 계정의 free_char_slots가 목업과 다를 수 있으므로 반드시 응답값을 써야 한다 —
      // 이전엔 멤버십만 실 데이터를 쓰고 무료 슬롯은 계속 MOCK_USER 걸 써서, 실 계정의
      // 무료 슬롯 구성이 목업과 달라지면 접근 제어가 어긋날 수 있었다.
      if (Array.isArray(data.free_char_slots)) freeCharSlots = data.free_char_slots;
    }
  } catch {
    // 백엔드 미연결 — 목업 멤버십/슬롯으로 폴백
  }

  const canAccess = canAccessCharacter(characterId, membership, freeCharSlots);
  // 프리미엄 기장의 지역 학습은 계속 막되, 스페셜 스토리 탭은 개별 5코인 해금과
  // 프리미엄 결제 이력의 영구 소장을 지원하므로 목록 자체는 열어둔다.
  if (!canAccess && tab !== "special") {
    redirect("/premium");
  }

  const chapters = getChaptersForCharacter(characterId);

  return (
    <>
      <LearnView char={char} chapters={chapters} />
      <BottomNav />
    </>
  );
}
