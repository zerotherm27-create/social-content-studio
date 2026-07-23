import { generateAgenticArtCardPrompt } from "./art-card-creative-agents";

export type ArtImageInput = {
  brandName: string;
  headline: string;
  subline: string;
  visualDirection: string;
  platform?: string;
  brandColor?: string;
  accentColor?: string;
  websiteHost?: string;
  audience?: string;
  offerContext?: string;
  campaignGoal?: string;
};

type ArtImageOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

export async function generatePremiumArtCardImage(input: ArtImageInput, options: ArtImageOptions = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;
  const model = options.model ?? process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
  const outputFormat = "png";
  const agenticPrompt = await generateAgenticArtCardPrompt(input, {
    apiKey,
    fetcher: options.fetcher
  }).catch((error) => {
    console.error("Art-card prompt agents fell back to deterministic prompt", {
      message: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  });

  return generateImageDataUrl({
    apiKey,
    model,
    fetcher: options.fetcher,
    prompt: buildPremiumArtCardPrompt(input, agenticPrompt),
    size: getPremiumArtCardSize(input.platform, model),
    quality: process.env.OPENAI_PREMIUM_IMAGE_QUALITY ?? process.env.OPENAI_IMAGE_QUALITY ?? "high",
    outputFormat,
    outputCompression: undefined,
    logContext: "Premium art-card image generation"
  });
}

export async function generateArtCardPhoto(input: ArtImageInput, options: ArtImageOptions = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;
  const model = options.model ?? process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";

  return generateImageDataUrl({
    apiKey,
    model,
    fetcher: options.fetcher,
    prompt: buildArtImagePrompt(input),
    size: getImageGenerationSize(input.platform, model),
    quality: process.env.OPENAI_IMAGE_QUALITY ?? "medium",
    outputFormat: "jpeg",
    outputCompression: 88,
    logContext: "Art image generation"
  });
}

async function generateImageDataUrl(input: {
  apiKey: string;
  model: string;
  fetcher?: typeof fetch;
  prompt: string;
  size: string;
  quality: string;
  outputFormat: "jpeg" | "png" | "webp";
  outputCompression?: number;
  logContext: string;
}) {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    size: input.size,
    quality: input.quality,
    output_format: input.outputFormat,
    background: "opaque",
    n: 1
  };

  if (typeof input.outputCompression === "number") {
    body.output_compression = input.outputCompression;
  }

  let response: Response;
  try {
    response = await (input.fetcher ?? fetch)("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(110_000),
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.error(`${input.logContext} request failed`, {
      model: input.model,
      message: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  }

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.error(`${input.logContext} failed`, {
      status: response.status,
      model: input.model,
      message: message.slice(0, 700)
    });
    return undefined;
  }

  const payload = await response.json() as { data?: Array<{ b64_json?: string }> };
  const image = payload.data?.[0]?.b64_json;
  return image ? `data:image/${input.outputFormat};base64,${image}` : undefined;
}

export function buildPremiumArtCardPrompt(input: ArtImageInput, agenticDirection?: string) {
  const exactHeadline = input.headline.trim();
  const exactSubline = input.subline.trim();
  const brandColorDirection = [
    input.brandColor ? `Primary brand color: ${input.brandColor}.` : "",
    input.accentColor ? `Accent color: ${input.accentColor}.` : ""
  ].filter(Boolean).join(" ");

  return [
    `Create one complete, finished social-media art card for ${input.brandName}.`,
    `Platform/format: ${getPlatformFormatDirection(input.platform)}. Make it ready to post, like a manually briefed Facebook/Instagram carousel cover or single-image art card.`,
    "Use a clean modern brand-card layout: bright background, clear hierarchy, large readable headline, short supporting line, simple CTA, and purposeful service/category visuals.",
    "Do not create a black card, blank card, dark placeholder, empty lower panel, wireframe, website mockup, unfinished template, or plain background.",
    "If this is FAQ/service/education content, use simple useful icons, service tiles, or neat visual categories. If this is proof/conversion content, use a realistic service scene with graphic accents.",
    "Use the brand colors deliberately and keep the design bright, polished, local-service friendly, and commercial.",
    "Keep all text large and readable. Do not use tiny fake paragraphs, lorem ipsum, fake disclaimers, random stamps, or decorative unreadable text.",
    "Do not add generic labels such as EDUCATION, PROMOTION, MARKETING CARD, READY TO POST, or SAMPLE.",
    "Do not invent unsupported prices, ratings, awards, guarantees, dates, certifications, or discounts.",
    "Render only the supplied brand/copy/CTA text, spell it exactly, and do not add extra marketing claims.",
    `Brand name text: ${input.brandName}.`,
    `Main headline text, exact spelling: ${exactHeadline}.`,
    `Supporting line text, exact spelling: ${exactSubline}.`,
    `CTA text: ${getPromptCta(input)}.`,
    input.websiteHost ? `Optional small brand/source text: ${input.websiteHost}.` : "",
    input.audience ? `Target customer: ${input.audience}.` : "",
    input.offerContext ? `Verified offer/context: ${input.offerContext}.` : "",
    input.campaignGoal ? `Marketing objective: ${input.campaignGoal}.` : "",
    brandColorDirection,
    agenticDirection ? `Internal marketing/image-director brief to follow: ${agenticDirection}.` : "",
    `Brand/posting style and campaign art direction to apply: ${input.visualDirection}.`,
    "Quality bar: it should look like a practical, clean social media manager brief turned into a real branded post, not AI filler."
  ].filter(Boolean).join(" ");
}

export function buildArtImagePrompt(input: ArtImageInput) {
  const brandColorDirection = [
    input.brandColor ? `Use ${input.brandColor} as the main brand-color accent in real-world objects, wardrobe, packaging, environment details, or color-blocked props.` : "",
    input.accentColor ? `Use ${input.accentColor} as a secondary accent, sparingly and tastefully.` : ""
  ].filter(Boolean).join(" ");

  return [
    "You are an award-winning commercial art director creating the photographic foundation for a premium paid social ad image and high-performing marketing asset.",
    `Produce one photorealistic campaign photograph with a single instantly understandable marketing idea for ${getPlatformFormatDirection(input.platform)}.`,
    "Treat this as the hero image for a brand-native promotional pub mat/poster. It must match the supplied art-card concept and look commercially useful, not like decorative stock photography.",
    "The viewer should understand the category, offer situation, and customer benefit within one second, even before copy is added.",
    "Show the actual product, result, or service moment as the hero. If a person appears, capture a believable action and customer situation—not a posed smiling portrait.",
    "Make it feel commissioned by a real commercial photographer: natural directional light, believable local setting, crisp tactile detail, controlled depth of field, realistic human posture, and a decisive crop with a strong foreground hero subject.",
    "Build visual proof into the scene using only supplied facts: process detail, product quantity, setting, packaging, ingredients, tools, or a visible outcome. Never invent awards, ratings, discounts, prices, or claims.",
    "Prefer one decisive scene over a pretty mood shot: product in hand, service being completed, order being packed, appointment moment, property feature being viewed, or customer result being shown.",
    "Compose with a designer's grid in mind: keep the hero subject visually dominant, avoid busy edges, and leave room for the final layout structure described in the scene direction.",
    "The final pub mat may place brand text, proof bubbles, CTA buttons, or trust bars around the photo. Keep the hero subject clear and avoid critical details where the scene direction says text or interface elements will sit.",
    "The image should support a promotional layout with brand, offer badge, headline, proof, and CTA added later. Do not make the composition compete with those elements.",
    "Avoid anything that looks AI-generated: no collage, no split panels, no floating icons, no chat bubbles, no checkmarks, no clock symbols, no fake app UI, no badge graphics, no oversized branded symbols printed on bags, no cartoon-like props, no 3D renders, no flat decorative shapes.",
    "Do not include readable text, captions, logos, watermarks, fake labels, misspelled signs, typography, or text-like marks inside the generated image.",
    "Avoid black backgrounds, black gradient fades, dark empty lower blocks, and underexposed negative space. Keep the full frame photographic and usable.",
    "Use the brand color theme naturally through wardrobe, bags, storefront details, props, or environment accents; do not invent a new color palette.",
    "Do not create fake copy boxes, badges, logos, or readable typography inside the generated photo; the application will add designed text and proof elements separately.",
    "Avoid distorted hands, distorted faces, extra fingers, warped objects, duplicated people, or uncanny anatomy.",
    `Brand: ${input.brandName}.`,
    input.platform ? `Publishing platform: ${input.platform.replaceAll("_", " ")}.` : "",
    input.websiteHost ? `Source domain for brand context only: ${input.websiteHost}.` : "",
    input.audience ? `Target customer: ${input.audience}. Make the setting and use case immediately recognizable to them without stereotyping.` : "",
    input.offerContext ? `Verified offer or campaign context: ${input.offerContext}. Visualize only details supported here.` : "",
    input.campaignGoal ? `Marketing objective: ${input.campaignGoal}. Compose the scene to support that action.` : "",
    brandColorDirection,
    `Primary marketing promise to visualize, without rendering these words as text: ${input.headline}.`,
    `Supporting benefit to imply visually, without rendering words: ${input.subline}.`,
    `Scene direction: ${input.visualDirection}.`
  ].filter(Boolean).join(" ");
}

function getPlatformFormatDirection(platform?: string) {
  switch (platform) {
    case "TIKTOK":
    case "INSTAGRAM_STORY":
      return "a 9:16 vertical mobile story/reel crop";
    case "GOOGLE_BUSINESS":
      return "a 4:3 landscape local business post crop";
    case "LINKEDIN":
      return "a polished 4:5 professional feed crop";
    case "THREADS":
      return "a clean 4:5 conversational social feed crop for Threads";
    case "FACEBOOK":
    case "INSTAGRAM":
    default:
      return "a 4:5 social feed crop";
  }
}

function getImageGenerationSize(platform?: string, model?: string) {
  if (model?.startsWith("gpt-image-2")) return getPremiumArtCardSize(platform, model);
  return platform === "GOOGLE_BUSINESS" ? "1536x1024" : "1024x1536";
}

function getPremiumArtCardSize(platform?: string, model?: string) {
  if (!model?.startsWith("gpt-image-2")) {
    return platform === "GOOGLE_BUSINESS" ? "1536x1024" : "1024x1536";
  }

  switch (platform) {
    case "TIKTOK":
    case "INSTAGRAM_STORY":
      return "1088x1936";
    case "GOOGLE_BUSINESS":
      return "1536x1024";
    case "FACEBOOK":
    case "INSTAGRAM":
    case "THREADS":
    case "LINKEDIN":
    default:
      return "1088x1360";
  }
}

function getPromptCta(input: ArtImageInput) {
  const text = `${input.headline} ${input.subline} ${input.visualDirection} ${input.offerContext ?? ""} ${input.campaignGoal ?? ""}`.toLowerCase();
  if (text.includes("book") && text.includes("pickup")) return "Book Pickup";
  if (text.includes("message") || text.includes("messenger") || text.includes("chat")) return "Message Us";
  if (text.includes("book") || text.includes("schedule") || text.includes("appointment") || text.includes("pickup")) return "Book Now";
  if (text.includes("order") || text.includes("shop") || text.includes("buy")) return "Order Now";
  if (text.includes("visit") || text.includes("store") || text.includes("location")) return "Visit Us";
  return "Learn More";
}
