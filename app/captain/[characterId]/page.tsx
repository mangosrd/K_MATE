import { notFound } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import { getCharacterById } from "@/lib/db/mock";
import CaptainHubView from "./CaptainHubView";

export default async function CaptainHubPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params;
  const character = getCharacterById(characterId);

  if (!character) notFound();

  return (
    <>
      <CaptainHubView character={character} />
      <BottomNav />
    </>
  );
}
