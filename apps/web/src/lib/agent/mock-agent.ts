import { MediaType, Platform, type MediaType as MediaTypeValue, type Platform as PlatformValue } from "../domain";

type GenerateDraftsInput = {
  brandName: string;
  voice: string;
  audience: string;
  campaignTitle: string;
  goal: string;
  source: string;
  platforms: PlatformValue[];
};

export type GeneratedDraft = {
  platform: PlatformValue;
  caption: string;
  mediaType: MediaTypeValue;
  hashtags: string[];
};

const platformHooks: Record<PlatformValue, string> = {
  FACEBOOK: "Bring the community into the story.",
  INSTAGRAM: "Make the first line visual and save-worthy.",
  GOOGLE_BUSINESS: "Give nearby customers a clear reason to visit.",
  TIKTOK: "Open with motion, contrast, and a fast reveal.",
  LINKEDIN: "Frame the update as a useful business insight."
};

const platformMedia: Record<PlatformValue, MediaTypeValue> = {
  FACEBOOK: MediaType.IMAGE,
  INSTAGRAM: MediaType.IMAGE,
  GOOGLE_BUSINESS: MediaType.IMAGE,
  TIKTOK: MediaType.VIDEO,
  LINKEDIN: MediaType.TEXT
};

export function generateDrafts(input: GenerateDraftsInput): GeneratedDraft[] {
  return input.platforms.map((platform) => {
    const hook = platformHooks[platform];
    return {
      platform,
      mediaType: platformMedia[platform],
      caption: `${hook} ${input.brandName} is sharing ${input.campaignTitle}. ${input.source} Built for ${input.audience}. Tone: ${input.voice}. Goal: ${input.goal}.`,
      hashtags: buildHashtags(input.brandName, input.campaignTitle)
    };
  });
}

function buildHashtags(brandName: string, campaignTitle: string) {
  const words = `${brandName} ${campaignTitle}`
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 5);

  return ["campaign", ...words].map((word) => `#${word.toLowerCase()}`);
}
