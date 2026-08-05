import { notFound, redirect } from "next/navigation";
import { getCharacterById } from "@/lib/db/mock";

export default async function CaptainHubPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params;
  const character = getCharacterById(characterId);

  if (!character) notFound();

  // The regional captain card already exposes study, chat, and diary actions.
  // Keep old links working without showing the duplicate captain menu.
  redirect(`/region/${character.region_id}`);
}
