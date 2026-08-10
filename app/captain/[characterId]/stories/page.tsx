import BackstoryView from "./BackstoryView";
export default async function BackstoriesPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params;
  return <BackstoryView characterId={characterId} />;
}
