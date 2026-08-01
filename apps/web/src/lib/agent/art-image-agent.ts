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

export type GeneratedPremiumArtCard = {
  dataUrl: string;
  prompt: string;
  model: string;
};

export async function generatePremiumArtCardImage(input: ArtImageInput, options: ArtImageOptions = {}) {
  const asset = await generatePremiumArtCardAsset(input, options);
  return asset?.dataUrl;
}

export async function generatePremiumArtCardAsset(input: ArtImageInput, options: ArtImageOptions = {}): Promise<GeneratedPremiumArtCard | undefined> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;
  const model = options.model ?? process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
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
  const prompt = buildPremiumArtCardPrompt(input, agenticPrompt);

  const dataUrl = await generateImageDataUrl({
    apiKey,
    model,
    fetcher: options.fetcher,
    prompt,
    size: getPremiumArtCardSize(input.platform, model),
    quality: process.env.OPENAI_PREMIUM_IMAGE_QUALITY ?? process.env.OPENAI_IMAGE_QUALITY ?? "high",
    outputFormat,
    outputCompression: undefined,
    logContext: "Premium art-card image generation"
  });

  return dataUrl ? { dataUrl, prompt, model } : undefined;
}

export async function generateArtCardPhoto(input: ArtImageInput, options: ArtImageOptions = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;
  const model = options.model ?? process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

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
    `Create one complete, finished modern corporate social-media poster/art card for ${input.brandName}.`,
    `Platform/format: ${getPlatformFormatDirection(input.platform)}. Make it ready to post, like a polished Canva-style corporate flyer or recruitment/promotional artcard, not a plain generated picture.`,
    "Target design label: modern corporate promotional poster with a clean infographic and photo-composite style.",
    "Follow this exact poster blueprint: top-left brand/logo area; large headline block beneath; one short supporting line; one row of 3 simple circular icon/info chips; one compact detail/info panel only if it uses supplied copy; one prominent rounded yellow CTA button; one tiny website/contact line directly below the CTA; right-side hero photo area. Do not add any other text zones.",
    "Use a 55/45 split composition: left side is a white information panel, right side is a polished photo area. Separate them with one flowing vertical curve edged in yellow. The curve should feel like a deliberate corporate flyer layout, not random decoration.",
    "Hero image rule: use one friendly, realistic staff/customer/service portrait or result photo, clean lighting, teal uniform or brand-colored accent, and relevant service context in the background. The person/object must not cover the headline or CTA.",
    "Use clean corporate branding: consistent teal, white, and yellow brand-color rhythm when brand colors are not otherwise supplied; rounded shapes; bright lighting; welcoming commercial tone.",
    "Use a photo-based promotional layout: one polished realistic service/staff/customer/result photo area combined with crisp graphic elements, not a full-frame photo and not a flat SVG template.",
    "Use modern flat-design graphics: simple line icons, rounded panels, circles, pill labels, contact/detail blocks, and bold geometric shapes that feel like a professional social media designer made them.",
    "Use editorial infographic structure: divide important details into clearly organized blocks such as offer, service, steps, location, qualification, benefits, contact, or CTA depending on the supplied copy. Keep the blocks visually structured even if the exact text is short.",
    "Use bold typographic advertising: oversized sans-serif headline, strong hierarchy, clean supporting line, and a prominent CTA badge/button.",
    "Use a curved split-layout design: a white information area and a photo/brand-color area separated by a flowing yellow-edged curve or sweeping shape. Create depth with overlapping circles, rounded cards, and subtle shadows.",
    "Make the result feel friendly and commercial: bright, trustworthy, approachable, like a real local brand’s social-media recruitment/promo flyer.",
    "Text discipline: each supplied text item may appear once only. Do not repeat the headline, subline, CTA, service list, website, location, audience, or contact text anywhere else on the poster.",
    "Audience and context discipline: audience, location, SEO keywords, and offer context are for visual direction only. Do not render them as readable text unless they are part of the supplied headline, subline, CTA, art-card text, or website/contact.",
    "Footer discipline: do not create any large footer panel, bottom banner, bottom teal block, bottom caption area, repeated website line, repeated location line, or extra bottom message. Keep the lower area clean. The website/contact may appear once only, small, directly under the CTA.",
    "Typography discipline: use a maximum of 6 readable text groups total: brand, headline, subline, up to three icon/info labels, CTA, website/contact. Leave clean whitespace between groups.",
    "Do not create a black card, blank card, dark placeholder, empty lower panel, wireframe, website mockup, unfinished template, plain background, or generic AI stock-photo scene.",
    "If this is FAQ/service/education content, use structured infographic panels, useful icons, or service tiles. If this is proof/conversion content, use a realistic photo-composite scene with graphic accents and CTA blocks.",
    "Use the brand colors deliberately and keep the design bright, polished, local-service friendly, and corporate-commercial.",
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
    "Quality bar: it should look like a real Canva-style corporate social-media artcard made by a professional graphic designer, with photo composite, rounded information blocks, bold headline hierarchy, clean brand consistency, a clean lower margin, and no duplicate footer copy — not AI filler."
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
