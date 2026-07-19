import { MediaType, Platform, type MediaType as MediaTypeValue, type Platform as PlatformValue } from "../domain";

type GenerateDraftsInput = {
  brandName: string;
  voice: string;
  audience: string;
  campaignTitle: string;
  goal: string;
  source: string;
  offers: string;
  visualStyle: string;
  bannedPhrases: string;
  tone: string;
  creativeDirection: string;
  platforms: PlatformValue[];
};

export type GeneratedDraft = {
  platform: PlatformValue;
  caption: string;
  mediaType: MediaTypeValue;
  hashtags: string[];
  artHeadline: string;
  artSubline: string;
  visualDirection: string;
};

const platformHooks: Record<PlatformValue, string> = {
  FACEBOOK: "Bring the community into the story.",
  INSTAGRAM: "Make the first line visual and save-worthy.",
  THREADS: "Start a useful, conversational update people can reply to.",
  GOOGLE_BUSINESS: "Give nearby customers a clear reason to visit.",
  TIKTOK: "Open with motion, contrast, and a fast reveal.",
  LINKEDIN: "Frame the update as a useful business insight."
};

const platformMedia: Record<PlatformValue, MediaTypeValue> = {
  FACEBOOK: MediaType.IMAGE,
  INSTAGRAM: MediaType.IMAGE,
  THREADS: MediaType.TEXT,
  GOOGLE_BUSINESS: MediaType.IMAGE,
  TIKTOK: MediaType.VIDEO,
  LINKEDIN: MediaType.TEXT
};

export function generateDrafts(input: GenerateDraftsInput): GeneratedDraft[] {
  return input.platforms.map((platform) => {
    const hook = platformHooks[platform];
    const offer = firstUsefulPhrase(input.source) || firstUsefulPhrase(input.offers) || input.campaignTitle;
    const benefit = firstUsefulPhrase(input.goal) || `Made for ${input.audience}`;
    return {
      platform,
      mediaType: platformMedia[platform],
      caption: `${hook} ${input.brandName}: ${offer} Made for ${input.audience}. ${benefit} ${getFallbackCta(platform, input.goal, input.source)}`,
      hashtags: buildHashtags(input.brandName, input.campaignTitle),
      artHeadline: trimWords(input.campaignTitle, 7),
      artSubline: trimWords(`${offer}. ${benefit}`, 16),
      visualDirection: input.creativeDirection || `${input.visualStyle}. Show the offer in use by ${input.audience}, with one clear hero subject and clean negative space for campaign copy.`
    };
  });
}

function firstUsefulPhrase(value: string) {
  return value.split(/[.!?\n]/).map((part) => part.trim()).find((part) => part.length > 2) ?? "";
}

function trimWords(value: string, maxWords: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.length > maxWords ? `${words.slice(0, maxWords).join(" ")}…` : words.join(" ");
}

function getFallbackCta(platform: PlatformValue, goal: string, source: string) {
  const text = `${goal} ${source}`.toLowerCase();
  if (text.includes("message") || text.includes("inquire")) return "Send us a message to get started.";
  if (text.includes("visit") || platform === Platform.GOOGLE_BUSINESS) return "Visit us when you're nearby.";
  if (text.includes("order") || text.includes("shop")) return "Order while the offer is available.";
  if (text.includes("book") || text.includes("appointment")) return "Book your preferred time.";
  return "See the details and take the next step.";
}

function buildHashtags(brandName: string, campaignTitle: string) {
  const words = `${brandName} ${campaignTitle}`
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 5);

  return ["campaign", ...words].map((word) => `#${word.toLowerCase()}`);
}
