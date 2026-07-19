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
  FACEBOOK: "For nearby customers who need a simple next step:",
  INSTAGRAM: "Save this if you want the easier version:",
  THREADS: "Small useful update:",
  GOOGLE_BUSINESS: "Nearby and ready when you are:",
  TIKTOK: "Show the problem, then the fix:",
  LINKEDIN: "A practical customer-experience update:"
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
    const benefit = customerBenefit(input) || `Made for ${input.audience}`;
    const angle = getCampaignAngle(`${input.campaignTitle} ${input.goal} ${input.source} ${input.offers}`);
    const headline = buildArtHeadline(input.campaignTitle, offer, angle);
    const subline = buildArtSubline(offer, benefit, input.audience, angle);
    return {
      platform,
      mediaType: platformMedia[platform],
      caption: buildCaption({ ...input, platform, hook, offer, benefit }),
      hashtags: buildHashtags(input.brandName, input.campaignTitle),
      artHeadline: headline,
      artSubline: subline,
      visualDirection: buildVisualDirection(input, platform, offer, angle)
    };
  });
}

function buildCaption(input: GenerateDraftsInput & { platform: PlatformValue; hook: string; offer: string; benefit: string }) {
  const cta = getFallbackCta(input.platform, input.goal, input.source);
  const audienceLine = input.audience ? `Made for ${input.audience}.` : "";

  if (input.platform === Platform.GOOGLE_BUSINESS) {
    return `${input.offer} ${input.brandName} makes the next step clear. ${input.benefit}. ${cta}`;
  }

  if (input.platform === Platform.INSTAGRAM) {
    return `${input.hook} ${input.offer}\n\n${input.benefit}. ${audienceLine}\n\n${cta}`;
  }

  if (input.platform === Platform.THREADS) {
    return `${input.hook} ${input.offer} ${input.benefit}. ${cta}`;
  }

  if (input.platform === Platform.TIKTOK) {
    return `${input.hook} ${input.offer} Show the real moment, the result, and the next step. ${cta}`;
  }

  return `${input.hook} ${input.brandName}: ${input.offer} ${audienceLine} ${input.benefit}. ${cta}`;
}

function firstUsefulPhrase(value: string) {
  return value.split(/[.!?\n]/).map((part) => part.trim()).find((part) => part.length > 2) ?? "";
}

function usefulPhrases(value: string) {
  return value.split(/[.!?\n]/).map((part) => part.trim()).filter((part) => part.length > 2);
}

function customerBenefit(input: GenerateDraftsInput) {
  const sourcePhrases = usefulPhrases(input.source);
  const offerPhrases = usefulPhrases(input.offers);
  const nonObjective =
    sourcePhrases.find((part) => !/^(drive|increase|launch|promote|announce|grow|generate)\b/i.test(part)) ??
    offerPhrases[0];

  if (nonObjective && nonObjective !== firstUsefulPhrase(input.source)) return nonObjective;
  if (sourcePhrases[1]) return sourcePhrases[1];
  return offerPhrases[0] ?? "";
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

function getCampaignAngle(value: string) {
  const text = value.toLowerCase();
  if (text.includes("book") || text.includes("appointment") || text.includes("pickup") || text.includes("schedule")) return "booking";
  if (text.includes("discount") || text.includes("off") || text.includes("free") || text.includes("promo") || text.includes("limited")) return "offer";
  if (text.includes("new") || text.includes("launch") || text.includes("introducing")) return "launch";
  if (text.includes("property") || text.includes("condo") || text.includes("inquiry")) return "inquiry";
  if (text.includes("visit") || text.includes("nearby") || text.includes("store")) return "local";
  return "action";
}

function buildArtHeadline(campaignTitle: string, offer: string, angle: string) {
  if (angle === "booking") return trimWords(offer.includes("book") ? offer : `Book ${campaignTitle}`, 6);
  if (angle === "offer") return trimWords(offer, 6);
  if (angle === "launch") return trimWords(campaignTitle.toLowerCase().includes("new") ? campaignTitle : `New ${campaignTitle}`, 6);
  if (angle === "inquiry") return trimWords(offer || campaignTitle, 6);
  return trimWords(campaignTitle, 6);
}

function buildArtSubline(offer: string, benefit: string, audience: string, angle: string) {
  const audienceContext = audience && !benefit.toLowerCase().includes(audience.toLowerCase()) ? `for ${audience}` : "";
  const benefitText = benefit.toLowerCase();
  if (angle === "booking" && benefitText.includes("pickup") && benefitText.includes("delivery")) {
    return "Pickup, care, and delivery in one booking step.";
  }
  if (angle === "booking") return trimWords(`${benefit} ${audienceContext} with one clear booking step.`, 16);
  if (angle === "offer") return trimWords(`${offer}. ${benefit}`, 16);
  if (angle === "launch") return trimWords(`${benefit} ${audienceContext}.`, 16);
  return trimWords(`${benefit} ${audienceContext}.`, 16);
}

function buildVisualDirection(input: GenerateDraftsInput, platform: PlatformValue, offer: string, angle: string) {
  const platformCrop = platform === Platform.GOOGLE_BUSINESS ? "landscape local-business crop" : platform === Platform.TIKTOK ? "vertical motion-first crop" : "4:5 feed crop";
  const base = input.creativeDirection || input.visualStyle || "Clean commercial photography with natural light";
  const moment =
    angle === "booking"
      ? "show the service being requested or completed, with the customer action visually obvious"
      : angle === "offer"
        ? "show the offer as the hero subject with one supporting proof detail nearby"
        : angle === "launch"
          ? "show the new product or service moment in the foreground"
          : "show the product or service in a believable customer-use moment";

  return `${base}. ${platformCrop}: ${moment}. Use a strong foreground subject, brand-color accents in real props or environment, calm lower-third negative space for copy, and no readable text inside the image.`;
}

function buildHashtags(brandName: string, campaignTitle: string) {
  const words = `${brandName} ${campaignTitle}`
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 5);

  return ["campaign", ...words].map((word) => `#${word.toLowerCase()}`);
}
