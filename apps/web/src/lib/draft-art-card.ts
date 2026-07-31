import type { Brand, Campaign } from "@prisma/client";
import { generatePremiumArtCardAsset } from "@/lib/agent/art-image-agent";
import { db } from "@/lib/db";
import { readPublicBrandAssets } from "@/lib/safe-website";

type DraftWithBrandAndCampaign = {
  id: string;
  platform: string;
  artHeadline: string;
  artSubline: string;
  visualDirection: string;
  brand: Brand;
  campaign: Campaign;
};

type IdeaWithBrand = {
  id: string;
  platform: string;
  title: string;
  hook: string;
  purpose: string;
  format: string;
  goal: string;
  artCardText: string;
  caption: string;
  cta: string;
  seoKeywords: string;
  imagePrompt: string;
  brand: Brand;
};

export type ArtCardExportFormat = {
  key: string;
  width: number;
  height: number;
  label: string;
};

type StoredArtCardRecord = {
  artCardImageBase64: string | null;
  artCardImageMimeType: string | null;
};

type DraftArtCardAsset = {
  kind: "image";
  body: Buffer;
  contentType: "image/png";
  generatedImage: true;
  format: ArtCardExportFormat;
};

const MASTER_ART_CARD_PLATFORM = "INSTAGRAM";

const ART_CARD_EXPORTS: Record<string, ArtCardExportFormat> = {
  INSTAGRAM: { key: "INSTAGRAM", width: 1080, height: 1350, label: "Instagram/Facebook feed 4:5" },
  FACEBOOK: { key: "FACEBOOK", width: 1080, height: 1350, label: "Facebook feed 4:5" },
  THREADS: { key: "THREADS", width: 1080, height: 1350, label: "Threads feed 4:5" },
  LINKEDIN: { key: "LINKEDIN", width: 1080, height: 1350, label: "LinkedIn feed 4:5" },
  SQUARE: { key: "SQUARE", width: 1080, height: 1080, label: "Square 1:1" },
  TIKTOK: { key: "TIKTOK", width: 1080, height: 1920, label: "TikTok/Reel/Story 9:16" },
  INSTAGRAM_STORY: { key: "INSTAGRAM_STORY", width: 1080, height: 1920, label: "Instagram Story 9:16" },
  STORY: { key: "STORY", width: 1080, height: 1920, label: "Story 9:16" },
  GOOGLE_BUSINESS: { key: "GOOGLE_BUSINESS", width: 1200, height: 900, label: "Google Business 4:3" }
};

export async function loadDraftArtCardAsset(draftId: string, requestedPlatform?: string): Promise<DraftArtCardAsset | undefined> {
  const draft = await db.contentDraft.findUnique({
    where: { id: draftId },
    select: {
      id: true,
      platform: true,
      artHeadline: true,
      artSubline: true,
      visualDirection: true,
      brand: true,
      campaign: true
    }
  });

  if (!draft) {
    return undefined;
  }

  return createDraftArtCardAsset(draft, requestedPlatform);
}

export async function loadIdeaArtCardAsset(ideaId: string, requestedPlatform?: string): Promise<DraftArtCardAsset | undefined> {
  const idea = await db.contentIdea.findUnique({
    where: { id: ideaId },
    select: {
      id: true,
      platform: true,
      title: true,
      hook: true,
      purpose: true,
      format: true,
      goal: true,
      artCardText: true,
      caption: true,
      cta: true,
      seoKeywords: true,
      imagePrompt: true,
      brand: true
    }
  });

  if (!idea) {
    return undefined;
  }

  return createIdeaArtCardAsset(idea, requestedPlatform);
}

export async function createDraftArtCardAsset(draft: DraftWithBrandAndCampaign, requestedPlatform?: string): Promise<DraftArtCardAsset> {
  const format = getArtCardExportFormat(requestedPlatform ?? draft.platform);
  const master = await getOrCreateDraftMasterArtCard(draft);
  return {
    kind: "image",
    body: await resizeArtCardImage(master.body, format),
    contentType: "image/png",
    generatedImage: true,
    format
  };
}

export async function createIdeaArtCardAsset(idea: IdeaWithBrand, requestedPlatform?: string): Promise<DraftArtCardAsset> {
  const format = getArtCardExportFormat(requestedPlatform ?? idea.platform);
  const master = await getOrCreateIdeaMasterArtCard(idea);
  return {
    kind: "image",
    body: await resizeArtCardImage(master.body, format),
    contentType: "image/png",
    generatedImage: true,
    format
  };
}

export function getArtCardExportFormat(value?: string | null): ArtCardExportFormat {
  const normalized = normalizeArtCardPlatform(value);
  return ART_CARD_EXPORTS[normalized] ?? ART_CARD_EXPORTS.INSTAGRAM;
}

export function normalizeArtCardPlatform(value?: string | null) {
  const normalized = (value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (normalized === "REEL" || normalized === "REELS" || normalized === "IG_STORY") return "INSTAGRAM_STORY";
  if (normalized === "GOOGLE" || normalized === "GOOGLE_MY_BUSINESS" || normalized === "GBP") return "GOOGLE_BUSINESS";
  if (normalized === "1:1" || normalized === "SQUARE_POST") return "SQUARE";
  return normalized && ART_CARD_EXPORTS[normalized] ? normalized : "INSTAGRAM";
}

export async function resizeArtCardImage(body: Buffer, format: ArtCardExportFormat) {
  void format;
  return body;
}

async function getOrCreateDraftMasterArtCard(draft: DraftWithBrandAndCampaign) {
  const stored = await readStoredMasterArtCard("ContentDraft", draft.id);
  if (stored) return stored;

  const assets = draft.brand.websiteUrl ? await readPublicBrandAssets(draft.brand.websiteUrl).catch(() => undefined) : undefined;
  const websiteHost = getWebsiteHost(draft.brand.websiteUrl, assets?.websiteHost);
  const visualDirection = draft.visualDirection || draft.campaign.creativeDirection || draft.brand.visualStyle;
  const headline = draft.artHeadline || draft.campaign.title;
  const subline = draft.artSubline || draft.campaign.goal;
  const generatedArtCard = await generatePremiumArtCardAsset({
    brandName: draft.brand.name,
    headline,
    subline,
    visualDirection,
    platform: MASTER_ART_CARD_PLATFORM,
    brandColor: assets?.brandColor,
    accentColor: assets?.accentColor,
    websiteHost,
    audience: draft.brand.audience,
    offerContext: draft.campaign.source || draft.brand.offers,
    campaignGoal: draft.campaign.goal
  }).catch((error) => {
    console.error("Draft art-card image generation failed", {
      draftId: draft.id,
      message: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  });

  const decoded = generatedArtCard ? dataUrlToBuffer(generatedArtCard.dataUrl) : undefined;
  if (!generatedArtCard || !decoded) {
    throw new Error("Real art-card image generation failed. Try again in a few moments if the image model is rate-limited.");
  }

  await saveStoredMasterArtCard("ContentDraft", draft.id, decoded, generatedArtCard.prompt);

  return decoded;
}

async function getOrCreateIdeaMasterArtCard(idea: IdeaWithBrand) {
  const stored = await readStoredMasterArtCard("ContentIdea", idea.id);
  if (stored) return stored;

  const assets = idea.brand.websiteUrl ? await readPublicBrandAssets(idea.brand.websiteUrl).catch(() => undefined) : undefined;
  const websiteHost = getWebsiteHost(idea.brand.websiteUrl, assets?.websiteHost);
  const visualDirection = `${idea.imagePrompt} ${idea.brand.visualStyle} Manual content brief: Platform ${idea.platform}; Format ${idea.format}; Goal ${idea.goal || idea.purpose}; Hook ${idea.hook}; Art Card Text ${idea.artCardText}; CTA ${idea.cta}; Caption ${idea.caption}; SEO Keywords ${idea.seoKeywords}.`;
  const generatedArtCard = await generatePremiumArtCardAsset({
    brandName: idea.brand.name,
    headline: idea.title,
    subline: idea.hook,
    visualDirection,
    platform: MASTER_ART_CARD_PLATFORM,
    brandColor: assets?.brandColor,
    accentColor: assets?.accentColor,
    websiteHost,
    audience: idea.brand.audience,
    offerContext: idea.brand.offers,
    campaignGoal: idea.goal || idea.purpose
  }).catch((error) => {
    console.error("Idea art-card image generation failed", {
      ideaId: idea.id,
      message: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  });

  const decoded = generatedArtCard ? dataUrlToBuffer(generatedArtCard.dataUrl) : undefined;
  if (!generatedArtCard || !decoded) {
    throw new Error("Real art-card image generation failed. Try again in a few moments if the image model is rate-limited.");
  }

  await saveStoredMasterArtCard("ContentIdea", idea.id, decoded, generatedArtCard.prompt);

  return decoded;
}

async function readStoredMasterArtCard(table: "ContentDraft" | "ContentIdea", id: string) {
  const rows = await db.$queryRawUnsafe<StoredArtCardRecord[]>(
    `SELECT "artCardImageBase64", "artCardImageMimeType" FROM "${table}" WHERE "id" = $1`,
    id
  ).catch((error) => {
    console.warn("Stored art-card columns are not available yet; generation will continue without reuse.", {
      table,
      message: error instanceof Error ? error.message : String(error)
    });
    return [];
  });
  return getStoredMasterArtCard(rows[0]);
}

async function saveStoredMasterArtCard(table: "ContentDraft" | "ContentIdea", id: string, decoded: { body: Buffer; contentType: string }, prompt: string) {
  await db.$executeRawUnsafe(
    `UPDATE "${table}" SET "artCardImageBase64" = $1, "artCardImageMimeType" = $2, "artCardPrompt" = $3, "artCardGeneratedAt" = $4 WHERE "id" = $5`,
    decoded.body.toString("base64"),
    decoded.contentType,
    prompt,
    new Date(),
    id
  ).catch((error) => {
    console.warn("Could not save generated art-card master yet; returning the image without persistence.", {
      table,
      message: error instanceof Error ? error.message : String(error)
    });
  });
}

function getStoredMasterArtCard(record?: StoredArtCardRecord) {
  if (!record) return undefined;
  if (!record.artCardImageBase64 || !record.artCardImageMimeType) return undefined;
  return {
    contentType: record.artCardImageMimeType,
    body: Buffer.from(record.artCardImageBase64, "base64")
  };
}

function getWebsiteHost(websiteUrl?: string | null, fallback?: string) {
  if (fallback) return fallback;
  if (!websiteUrl) return undefined;
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return undefined;

  return {
    contentType: match[1],
    body: Buffer.from(match[2], "base64")
  };
}
