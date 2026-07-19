import { Platform, type Platform as PlatformValue } from "../domain";

export type SocialIntelligenceInput = {
  brandName: string;
  voice?: string;
  audience?: string;
  offers?: string;
  visualStyle?: string;
  bannedPhrases?: string;
  campaignTitle?: string;
  goal?: string;
  source?: string;
  tone?: string;
  creativeDirection?: string;
  platforms?: PlatformValue[];
};

export type CampaignAngle =
  | "booking"
  | "offer"
  | "launch"
  | "local_visit"
  | "inquiry"
  | "education"
  | "social_proof"
  | "community"
  | "behind_the_scenes"
  | "retention";

export type FunnelStage = "awareness" | "consideration" | "conversion" | "retention";

type PlatformPlaybook = {
  role: string;
  openingMove: string;
  bestFormats: string[];
  captionStyle: string;
  creativeMandate: string;
  avoid: string[];
};

export function buildSocialIntelligenceBrief(input: SocialIntelligenceInput) {
  const angle = inferCampaignAngle(input);
  const funnelStage = inferFunnelStage(input, angle);
  const platforms = input.platforms?.length ? input.platforms : [Platform.FACEBOOK, Platform.INSTAGRAM, Platform.GOOGLE_BUSINESS];

  return {
    agentMode: "senior social media strategist + creative director + publishing QA",
    brandRead: {
      name: input.brandName,
      voice: input.voice || "Use a clear brand voice from the supplied evidence.",
      audience: input.audience || "Infer the likely customer from the offer, but do not stereotype.",
      offerTruths: compact(input.offers || input.source || ""),
      visualSystem: compact(input.visualStyle || input.creativeDirection || "")
    },
    campaignStrategy: {
      angle,
      funnelStage,
      customerQuestion: getCustomerQuestion(angle, funnelStage),
      conversionAction: getConversionAction(input, angle),
      proofToSeek: getProofToSeek(angle),
      contentJob: getContentJob(angle, funnelStage)
    },
    platformPlaybooks: Object.fromEntries(platforms.map((platform) => [platform, getPlatformPlaybook(platform, angle, funnelStage)])),
    creativeStandards: [
      "Start from the customer's real situation, not the brand's desire to announce something.",
      "Use one idea per post: one audience, one promise, one proof point, one next step.",
      "Make the image do a job: demonstrate the product/service, show the result, prove the process, or make the offer instantly understandable.",
      "Use brand-native visual conventions from the evidence before inventing a new style.",
      "Design for mobile first: thumb-stopping headline, safe-zone composition, readable hierarchy, no overlap, no tiny legal-looking text.",
      "Prefer concrete nouns and customer actions over abstract adjectives.",
      "Keep claims conservative unless the source explicitly proves them."
    ],
    qualityGate: [
      "Would a real social media manager post this for the brand?",
      "Can the audience understand the offer in under two seconds?",
      "Is the platform behavior correct, or is this the same caption pasted everywhere?",
      "Is every claim supported by brand/campaign evidence?",
      "Does the art-card direction describe a complete design concept, not just a stock photo?",
      "Are banned phrases, fake guarantees, generic stamps, and AI clichés absent?"
    ],
    antiPatterns: [
      "generic flyer",
      "template pull-out",
      "stock-photo mood board",
      "floating icons without purpose",
      "text overlapping the hero subject",
      "unreadable AI-rendered copy",
      "unsupported discounts or guarantees",
      "same caption adapted only by changing hashtags"
    ]
  };
}

export function inferCampaignAngle(input: SocialIntelligenceInput): CampaignAngle {
  const text = searchable(input);
  if (/\b(book|booking|appointment|pickup|schedule|reserve)\b/.test(text)) return "booking";
  if (/\b(discount|promo|sale|off|free|limited|bundle|deal)\b/.test(text)) return "offer";
  if (/\b(new|launch|introducing|now available|grand opening)\b/.test(text)) return "launch";
  if (/\b(condo|property|unit|inquiry|tour|viewing|lease|rent|real estate)\b/.test(text)) return "inquiry";
  if (/\b(visit|nearby|store|branch|location|walk in|local)\b/.test(text)) return "local_visit";
  if (/\b(review|testimonial|trusted|customers say|case study|proof)\b/.test(text)) return "social_proof";
  if (/\b(behind|process|how we|team|packed|made|prepared)\b/.test(text)) return "behind_the_scenes";
  if (/\b(tip|guide|learn|how to|what to know|education|save this)\b/.test(text)) return "education";
  if (/\b(thank you|community|neighbors|local story|celebrate)\b/.test(text)) return "community";
  return "retention";
}

export function inferFunnelStage(input: SocialIntelligenceInput, angle = inferCampaignAngle(input)): FunnelStage {
  const text = searchable(input);
  if (["booking", "offer", "inquiry", "local_visit"].includes(angle)) return "conversion";
  if (["education", "social_proof"].includes(angle)) return "consideration";
  if (/\b(rebook|again|loyal|returning|existing customer)\b/.test(text)) return "retention";
  return "awareness";
}

export function getPlatformPlaybook(platform: PlatformValue, angle: CampaignAngle, funnelStage: FunnelStage): PlatformPlaybook {
  const conversion = funnelStage === "conversion";
  switch (platform) {
    case Platform.INSTAGRAM:
      return {
        role: "visual demand creation and saves/shares",
        openingMove: conversion ? "Lead with the benefit or result, then make the action obvious." : "Lead with a crisp customer truth or visual hook.",
        bestFormats: ["premium single-image art card", "carousel cover + proof slides", "short reel with before/after or process"],
        captionStyle: "short, visual, specific, benefit-led; line breaks are useful; avoid sounding corporate",
        creativeMandate: "strong cover image, large readable headline, brand-color discipline, clean CTA, no clutter",
        avoid: ["long paragraph first lines", "generic motivational copy", "hashtags as the main strategy"]
      };
    case Platform.FACEBOOK:
      return {
        role: "local trust, replies, shares, and practical action",
        openingMove: "Start with a familiar customer problem, local situation, or direct offer.",
        bestFormats: ["single-image local offer", "before/after proof post", "community question with useful detail"],
        captionStyle: "human, clear, slightly warmer; ask for the next action without sounding needy",
        creativeMandate: "make the service and next step obvious for a fast-scrolling local customer",
        avoid: ["brand-first announcements", "inside-baseball marketing language", "overly polished corporate tone"]
      };
    case Platform.GOOGLE_BUSINESS:
      return {
        role: "high-intent local search conversion",
        openingMove: "Lead with the practical service, location/use case, availability, or booking action.",
        bestFormats: ["service update", "offer post", "event/local availability post"],
        captionStyle: "plain, searchable, action-oriented; include concrete service terms",
        creativeMandate: "show the business/category clearly; prioritize legibility over cleverness",
        avoid: ["vague lifestyle captions", "jokes", "hashtags doing the work"]
      };
    case Platform.THREADS:
      return {
        role: "conversation, lightweight trust, and brand personality",
        openingMove: "Use a specific observation or question people can reply to.",
        bestFormats: ["text-first prompt", "quick opinion", "behind-the-scenes note"],
        captionStyle: "conversational, compact, lower-polish, no hard-sell unless the campaign is urgent",
        creativeMandate: "if visual, use a simple proof image rather than a busy ad",
        avoid: ["sales flyer energy", "too many hashtags", "formal brand voice"]
      };
    case Platform.TIKTOK:
      return {
        role: "attention, process proof, and repeatable video concepts",
        openingMove: "Open with motion, contrast, before/after, or a visible problem being solved.",
        bestFormats: ["process video", "before/after", "day-in-the-life", "customer POV"],
        captionStyle: "short hook + context + action; let the video carry the proof",
        creativeMandate: "show the transformation or service step in the first second",
        avoid: ["static poster thinking", "slow intros", "talking about the brand before showing the payoff"]
      };
    case Platform.LINKEDIN:
      return {
        role: "business relevance, operational credibility, and professional trust",
        openingMove: "Lead with the customer/business problem or a useful operating insight.",
        bestFormats: ["insight post", "case-style proof", "professional service update"],
        captionStyle: "clear, useful, restrained; avoid hustle-bro or consumer-ad slang",
        creativeMandate: "polished editorial visual or simple proof graphic; no loud promo aesthetic",
        avoid: ["emoji-heavy copy", "consumer discount framing", "unsupported performance claims"]
      };
    default:
      return {
        role: `${angle} content`,
        openingMove: "Lead with the customer benefit.",
        bestFormats: ["single image", "short caption"],
        captionStyle: "clear and specific",
        creativeMandate: "clean hierarchy and obvious next step",
        avoid: ["generic claims"]
      };
  }
}

export function buildStrategicVisualDirection(input: SocialIntelligenceInput & { platform: PlatformValue; base?: string }) {
  const angle = inferCampaignAngle(input);
  const funnelStage = inferFunnelStage(input, angle);
  const playbook = getPlatformPlaybook(input.platform, angle, funnelStage);
  const base = input.base || input.creativeDirection || input.visualStyle || "premium brand-native social creative";

  return [
    `${base}.`,
    `Campaign angle: ${angle}; funnel stage: ${funnelStage}.`,
    `Platform role: ${playbook.role}.`,
    `Creative mandate: ${playbook.creativeMandate}.`,
    "Create a finished social art-card concept with one dominant hero visual, one readable headline zone, one support line, one CTA, and only purposeful proof/benefit cues.",
    "Use the brand visual system when provided; do not create a generic template or add random stamps.",
    "Keep hero subject, copy, CTA, and proof elements separated with generous safe space."
  ].join(" ");
}

function searchable(input: SocialIntelligenceInput) {
  return [
    input.brandName,
    input.audience,
    input.offers,
    input.visualStyle,
    input.campaignTitle,
    input.goal,
    input.source,
    input.tone,
    input.creativeDirection
  ].filter(Boolean).join(" ").toLowerCase();
}

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 900);
}

function getCustomerQuestion(angle: CampaignAngle, funnelStage: FunnelStage) {
  if (angle === "booking") return "Can this solve my need quickly, and how do I book?";
  if (angle === "offer") return "Is this relevant to me, and what exactly do I get?";
  if (angle === "launch") return "What is new, and why should I care now?";
  if (angle === "local_visit") return "Is this nearby, available, and worth visiting?";
  if (angle === "inquiry") return "Is this a good fit, and what should I ask next?";
  if (angle === "education") return "What useful thing can I learn or save?";
  if (angle === "social_proof") return "Can I trust this brand to deliver?";
  if (angle === "behind_the_scenes") return "What happens behind the result?";
  if (funnelStage === "retention") return "Why should I come back or rebook?";
  return "Why should I stop scrolling for this brand?";
}

function getConversionAction(input: SocialIntelligenceInput, angle: CampaignAngle) {
  const text = searchable(input);
  if (angle === "booking" || /\b(book|pickup|appointment|schedule)\b/.test(text)) return "book or schedule";
  if (angle === "inquiry") return "send an inquiry";
  if (angle === "local_visit") return "visit the location";
  if (/\b(order|shop|buy)\b/.test(text)) return "order or shop";
  if (/\b(message|messenger|dm|chat)\b/.test(text)) return "message the brand";
  return "take the next clear step";
}

function getProofToSeek(angle: CampaignAngle) {
  if (angle === "booking") return "process clarity, before/after result, speed cue, pickup/dropoff proof";
  if (angle === "offer") return "what is included, product quantity, deadline or eligibility if provided";
  if (angle === "launch") return "new item/service detail, product close-up, first-use moment";
  if (angle === "inquiry") return "feature detail, location, real environment, next-step clarity";
  if (angle === "social_proof") return "customer quote, repeat behavior, visible result, review count only if supplied";
  if (angle === "behind_the_scenes") return "hands, tools, workflow, preparation, quality-control moment";
  if (angle === "education") return "specific tip, mistake to avoid, comparison, checklist";
  return "specific service/product detail from the evidence";
}

function getContentJob(angle: CampaignAngle, funnelStage: FunnelStage) {
  if (funnelStage === "conversion") return "remove friction and make the next action feel obvious";
  if (angle === "education") return "make the brand useful before asking for action";
  if (angle === "social_proof") return "turn trust into confidence";
  if (angle === "behind_the_scenes") return "make invisible work visible";
  if (funnelStage === "retention") return "give existing customers a reason to return";
  return "create recognition and interest without over-selling";
}
