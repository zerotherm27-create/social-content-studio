import type { Brand, Campaign, ContentDraft } from "@prisma/client";
import { generateArtCardPhoto } from "@/lib/agent/art-image-agent";
import { createArtCardSvg } from "@/lib/art-card";
import { db } from "@/lib/db";
import { readPublicBrandAssets } from "@/lib/safe-website";

type DraftWithBrandAndCampaign = ContentDraft & {
  brand: Brand;
  campaign: Campaign;
};

export async function loadDraftArtCardSvg(draftId: string) {
  const draft = await db.contentDraft.findUnique({
    where: { id: draftId },
    include: { brand: true, campaign: true }
  });

  if (!draft) {
    return undefined;
  }

  return createDraftArtCardSvg(draft);
}

export async function createDraftArtCardSvg(draft: DraftWithBrandAndCampaign) {
  const assets = draft.brand.websiteUrl ? await readPublicBrandAssets(draft.brand.websiteUrl).catch(() => undefined) : undefined;
  const websiteHost = assets?.websiteHost ?? (draft.brand.websiteUrl ? new URL(draft.brand.websiteUrl).hostname.replace(/^www\./, "") : undefined);
  const visualDirection = draft.visualDirection || draft.campaign.creativeDirection || draft.brand.visualStyle;
  const headline = draft.artHeadline || draft.campaign.title;
  const subline = draft.artSubline || draft.campaign.goal;
  const generatedPhoto = await generateArtCardPhoto({
    brandName: draft.brand.name,
    headline,
    subline,
    visualDirection,
    platform: draft.platform,
    brandColor: assets?.brandColor,
    accentColor: assets?.accentColor,
    websiteHost,
    audience: draft.brand.audience,
    offerContext: draft.campaign.source || draft.brand.offers,
    campaignGoal: draft.campaign.goal
  }).catch(() => undefined);

  return {
    svg: createArtCardSvg({
      brandName: draft.brand.name,
      eyebrow: draft.platform.replaceAll("_", " "),
      headline,
      subline,
      visualDirection,
      platform: draft.platform,
      backgroundImage: generatedPhoto,
      logoImage: assets?.logoImage,
      brandColor: assets?.brandColor,
      accentColor: assets?.accentColor,
      websiteHost,
      marketingGoal: draft.campaign.goal,
      offerContext: draft.campaign.source || draft.brand.offers
    }),
    generatedPhoto
  };
}
