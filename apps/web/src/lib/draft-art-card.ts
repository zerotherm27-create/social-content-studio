import type { Brand, Campaign, ContentDraft } from "@prisma/client";
import { generateArtCardPhoto } from "@/lib/agent/art-image-agent";
import { db } from "@/lib/db";
import { createRasterArtCard, isUsableRasterImage } from "@/lib/raster-art-card";
import { readPublicBrandAssets } from "@/lib/safe-website";

type DraftWithBrandAndCampaign = ContentDraft & {
  brand: Brand;
  campaign: Campaign;
};

type DraftArtCardAsset = { kind: "image"; body: Buffer; contentType: string; generatedImage: true };

export async function loadDraftArtCardAsset(draftId: string): Promise<DraftArtCardAsset | undefined> {
  const draft = await db.contentDraft.findUnique({
    where: { id: draftId },
    include: { brand: true, campaign: true }
  });

  if (!draft) {
    return undefined;
  }

  return createDraftArtCardAsset(draft);
}

export async function createDraftArtCardAsset(draft: DraftWithBrandAndCampaign): Promise<DraftArtCardAsset> {
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
  }).catch((error) => {
    console.error("Draft art-card photo generation failed", {
      draftId: draft.id,
      message: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  });

  const decoded = generatedPhoto ? dataUrlToBuffer(generatedPhoto) : undefined;
  if (decoded && await isUsableRasterImage(decoded.body)) {
    const card = await createRasterArtCard({
      brandName: draft.brand.name,
      headline,
      subline,
      visualDirection,
      platform: draft.platform,
      brandColor: assets?.brandColor,
      accentColor: assets?.accentColor,
      websiteHost,
      photo: decoded.body,
      photoContentType: decoded.contentType
    });
    return {
      kind: "image",
      body: card.body,
      contentType: card.contentType,
      generatedImage: true
    };
  }

  throw new Error("Real art-card image generation failed or produced an unusable dark/blank image.");
}

export function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return undefined;

  return {
    contentType: match[1],
    body: Buffer.from(match[2], "base64")
  };
}
