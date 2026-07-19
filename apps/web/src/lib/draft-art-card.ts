import type { Brand, Campaign, ContentDraft } from "@prisma/client";
import { generatePremiumArtCardImage } from "@/lib/agent/art-image-agent";
import { createArtCardSvg } from "@/lib/art-card";
import { db } from "@/lib/db";
import { readPublicBrandAssets } from "@/lib/safe-website";

type DraftWithBrandAndCampaign = ContentDraft & {
  brand: Brand;
  campaign: Campaign;
};

type DraftArtCardAsset =
  | { kind: "image"; body: Buffer; contentType: string; generatedImage: true }
  | { kind: "svg"; svg: string; generatedImage: false };

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
  const generatedArtCard = await generatePremiumArtCardImage({
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

  if (generatedArtCard) {
    const decoded = dataUrlToBuffer(generatedArtCard);
    if (decoded) {
      return {
        kind: "image",
        body: decoded.body,
        contentType: decoded.contentType,
        generatedImage: true
      };
    }
  }

  return {
    kind: "svg",
    svg: createArtCardSvg({
      brandName: draft.brand.name,
      eyebrow: draft.platform.replaceAll("_", " "),
      headline,
      subline,
      visualDirection,
      platform: draft.platform,
      logoImage: assets?.logoImage,
      brandColor: assets?.brandColor,
      accentColor: assets?.accentColor,
      websiteHost,
      marketingGoal: draft.campaign.goal,
      offerContext: draft.campaign.source || draft.brand.offers
    }),
    generatedImage: false
  };
}

export async function loadDraftArtCardSvg(draftId: string) {
  const result = await loadDraftArtCardAsset(draftId);
  if (!result) return undefined;
  if (result.kind === "svg") return { svg: result.svg, generatedPhoto: undefined };

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><image href="data:${result.contentType};base64,${result.body.toString("base64")}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/></svg>`,
    generatedPhoto: `data:${result.contentType};base64,${result.body.toString("base64")}`
  };
}

export function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return undefined;

  return {
    contentType: match[1],
    body: Buffer.from(match[2], "base64")
  };
}
