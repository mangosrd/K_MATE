import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import { getCharacterById, getChaptersForCharacter, MOCK_ALL_PROGRESS, canAccessCharacter, MOCK_USER } from "@/lib/db/mock";
import LearnView from "./LearnView";
import LockedNotice from "./LockedNotice";

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
