type ArtImageInput = {
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

export async function generateArtCardPhoto(input: ArtImageInput, options: ArtImageOptions = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;
  const model = options.model ?? process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";

  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(55_000),
      body: JSON.stringify({
        model,
        prompt: buildArtImagePrompt(input),
        size: getImageGenerationSize(input.platform),
        quality: process.env.OPENAI_IMAGE_QUALITY ?? "medium",
        output_format: "jpeg",
        output_compression: 88,
        background: "opaque",
        n: 1
      })
    });
  } catch (error) {
    console.error("Art image generation request failed", {
      model,
      headline: input.headline,
      message: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  }

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.error("Art image generation failed", {
      status: response.status,
      model,
      headline: input.headline,
      message: message.slice(0, 700)
    });
    return undefined;
  }

  const payload = await response.json() as { data?: Array<{ b64_json?: string }> };
  const image = payload.data?.[0]?.b64_json;
  return image ? `data:image/jpeg;base64,${image}` : undefined;
}

export function buildArtImagePrompt(input: ArtImageInput) {
  const brandColorDirection = [
    input.brandColor ? `Use ${input.brandColor} as the main brand-color accent in real-world objects, wardrobe, packaging, environment details, or color-blocked props.` : "",
    input.accentColor ? `Use ${input.accentColor} as a secondary accent, sparingly and tastefully.` : ""
  ].filter(Boolean).join(" ");

  return [
    "You are an award-winning commercial art director creating the photographic foundation for a premium paid social ad image and high-performing marketing asset.",
    `Produce one photorealistic campaign photograph with a single instantly understandable marketing idea for ${getPlatformFormatDirection(input.platform)}.`,
    "Treat this as the hero image for a promotional pub mat/poster. It must look commercially useful, not like decorative stock photography.",
    "The viewer should understand the category, offer situation, and customer benefit within one second, even before copy is added.",
    "Show the actual product, result, or service moment as the hero. If a person appears, capture a believable action and customer situation—not a posed smiling portrait.",
    "Make it feel commissioned by a real commercial photographer: natural directional light, believable local setting, crisp tactile detail, controlled depth of field, realistic human posture, and a decisive crop with a strong foreground hero subject.",
    "Build visual proof into the scene using only supplied facts: process detail, product quantity, setting, packaging, ingredients, tools, or a visible outcome. Never invent awards, ratings, discounts, prices, or claims.",
    "Prefer one decisive scene over a pretty mood shot: product in hand, service being completed, order being packed, appointment moment, property feature being viewed, or customer result being shown.",
    "Compose with a designer's grid in mind: keep the hero subject visually dominant, avoid busy edges, preserve clean copy-safe space, and create a natural path from subject to the future headline area.",
    "The image should support a promotional layout with brand, offer badge, headline, proof, and CTA added later. Do not make the composition compete with those elements.",
    "Avoid anything that looks AI-generated: no collage, no split panels, no floating icons, no chat bubbles, no checkmarks, no clock symbols, no fake app UI, no badge graphics, no oversized branded symbols printed on bags, no cartoon-like props, no 3D renders, no flat decorative shapes.",
    "Do not include readable text, captions, logos, watermarks, fake labels, misspelled signs, typography, or text-like marks inside the generated image.",
    "Avoid black backgrounds, black gradient fades, dark empty lower blocks, and underexposed negative space. Keep the full frame photographic and usable.",
    "Use the brand color theme naturally through wardrobe, bags, storefront details, props, or environment accents; do not invent a new color palette.",
    "Reserve a calm area with strong tonal contrast on the lower third for short marketing copy. Keep this area photographic; do not create a fake empty box or dark slab.",
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

function getImageGenerationSize(platform?: string) {
  return platform === "GOOGLE_BUSINESS" ? "1536x1024" : "1024x1536";
}
