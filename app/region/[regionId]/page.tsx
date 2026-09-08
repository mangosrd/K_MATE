import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRegionById } from "@/lib/db/mock";
import RegionView from "./RegionView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ regionId: string }>;
}): Promise<Metadata> {
  const { regionId } = await params;
  const region = getRegionById(regionId);
  return {
    title: `${region?.name ?? regionId} — K-MATE`,
    description: region?.description_en,
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ regionId: string }>;
}) {
  const { regionId } = await params;
  const region = getRegionById(regionId);
  // Premium regions remain browsable so users can preview the route and its
  // captain. Access is gated on the captain actions inside RegionView.
  if (!region) notFound();

  return <RegionView region={region} />;
}
