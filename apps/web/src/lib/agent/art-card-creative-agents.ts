import { z } from "zod";
import { Platform, type Platform as PlatformValue } from "../domain";
import { buildSocialIntelligenceBrief, getPlatformPlaybook, inferCampaignAngle, inferFunnelStage } from "./social-intelligence";
import type { ArtImageInput } from "./art-image-agent";

type CreativeAgentOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

const artCardPromptSchema = z.object({
  marketingPlaybook: z.object({
    audienceInsight: z.string().min(2),
    hookTopic: z.string().min(2),
    contentPillar: z.string().min(2),
    format: z.string().min(2),
    postJob: z.string().min(2),
    proofToShow: z.string().min(2),
    conversionAction: z.string().min(2),
    seoKeywords: z.array(z.string().min(2)).min(2).max(8)
  }),
  contentScript: z.object({
    hook: z.string().min(2).max(120),
    headline: z.string().min(1).max(72),
    subline: z.string().min(1).max(140),
    cta: z.string().min(1).max(32),
    caption: z.string().min(2),
    hierarchy: z.string().min(2),
    avoid: z.array(z.string().min(2)).min(3).max(8)
  }),
  imageBrief: z.object({
    prompt: z.string().min(80).max(1800)
  })
});

export type ArtCardAgentHandoff = z.infer<typeof artCardPromptSchema>;

export async function generateAgenticArtCardPrompt(input: ArtImageInput, options: CreativeAgentOptions = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;

  const response = await (options.fetcher ?? fetch)("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify(buildArtCardPromptAgentRequest(input, options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini"))
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.error("Art-card prompt agents failed", {
      status: response.status,
      message: message.slice(0, 700)
    });
    return undefined;
  }

  const payload = await response.json();
  const outputText = typeof payload.output_text === "string" ? payload.output_text : extractOutputText(payload);
  return artCardPromptSchema.parse(JSON.parse(outputText)).imageBrief.prompt;
}

export function buildArtCardPromptAgentRequest(input: ArtImageInput, model: string) {
  const platform = normalizePlatform(input.platform);
  const angle = inferCampaignAngle({
    brandName: input.brandName,
    audience: input.audience,
    offers: input.offerContext,
    visualStyle: input.visualDirection,
    campaignTitle: input.headline,
    goal: input.campaignGoal,
    source: input.subline,
    creativeDirection: input.visualDirection
  });
  const funnelStage = inferFunnelStage({
    brandName: input.brandName,
    audience: input.audience,
    offers: input.offerContext,
    visualStyle: input.visualDirection,
    campaignTitle: input.headline,
    goal: input.campaignGoal,
    source: input.subline,
    creativeDirection: input.visualDirection
  }, angle);
  const playbook = getPlatformPlaybook(platform, angle, funnelStage);
  const socialIntelligence = buildSocialIntelligenceBrief({
    brandName: input.brandName,
    audience: input.audience,
    offers: input.offerContext,
    visualStyle: input.visualDirection,
    campaignTitle: input.headline,
    goal: input.campaignGoal,
    source: input.subline,
    creativeDirection: input.visualDirection
  });

  return {
    model,
    instructions: [
      "You are Orbit's internal creative-agent room. Three specialist agents must collaborate before image generation.",
      "Agent 1, Marketing Strategist: choose the content pillar, hook topic, platform format, customer friction, SEO keywords, post job, proof, and conversion playbook from Brand DNA.",
      "Agent 2, Social Copy and Prompt Writer: turn the strategy into a manual content brief: hook, art-card headline, art-card subtext, caption, CTA, and hierarchy.",
      "Agent 3, Image Director: write the final image-generation prompt for the chosen format, whether it is a FAQ icon card, service menu, carousel cover, proof card, checklist, or photo-led ad.",
      "Return only schema-valid JSON. The final prompt must be brand-native, specific, visually composed, and safe for direct image generation."
    ].join(" "),
    input: [{
      role: "user",
      content: [{
        type: "input_text",
        text: JSON.stringify({
          brandDNA: {
            brandName: input.brandName,
            audience: input.audience,
            websiteHost: input.websiteHost,
            brandColor: input.brandColor,
            accentColor: input.accentColor,
            visualStyle: input.visualDirection,
            offerContext: input.offerContext,
            campaignGoal: input.campaignGoal
          },
          suppliedPosterCopy: {
            headline: input.headline,
            subline: input.subline,
            cta: getAgentCta(input)
          },
          preferredManualBriefShape: {
            title: "Modern corporate poster artcard",
            platforms: ["Google", "Facebook", "Instagram carousel", "Instagram feed"],
            format: "Photo-composite corporate poster / Canva-style social artcard",
            goal: "Make the brand look trustworthy, organized, and ready to act on",
            hook: "Clear oversized headline with one direct customer action.",
            artCardText: ["Large headline", "Short supporting line", "Organized info blocks", "Prominent CTA"],
            caption: "Use Brand DNA to explain the offer or hiring/promo message in a friendly, practical tone.",
            cta: "Use the safest supplied CTA such as Book Pickup, Message Us, Apply Now, or Learn More.",
            seoKeywords: ["laundry service Metro Manila", "wash dry fold", "dry cleaning", "pickup and delivery"],
            imagePromptStyle: "Modern corporate promotional poster with clean teal-white-yellow branding, a 55/45 split composition, white info panel on the left, photo-composite staff/service image on the right, one flowing yellow-edged curve between panels, rounded infographic chips, simple line icons, oversized sans-serif headline, prominent CTA badge, and no duplicate footer text."
          },
          platform,
          inferredStrategy: {
            angle,
            funnelStage,
            playbook,
            socialIntelligence
          },
          handoffRules: [
            "Do not invent unsupported prices, awards, dates, review counts, guarantees, discounts, locations, certifications, or claims.",
            "Use the supplied headline, subline, CTA, brand name, and source domain as the only readable text in the art card.",
            "Prefer a modern corporate poster layout over a raw photorealistic scene: photo-composite plus designed infographic sections.",
            "Use clean corporate branding: teal/white/yellow rhythm unless Brand DNA supplies different colors, rounded panels, circles, icon blocks, and bold geometric shapes.",
            "Use a curved split layout where a white information area and photo area are separated by a flowing yellow-edged curve.",
            "Use a strict text map: brand/logo once, headline once, subline once, up to three icon/info labels, CTA once, optional small website/contact once.",
            "Audience, location, SEO keywords, and offer context guide visuals only. Do not render them as readable text unless the supplied poster copy explicitly contains them.",
            "Do not create a large bottom banner, bottom teal block, repeated footer copy, repeated website, or repeated location. Website/contact may appear once only, small, directly under the CTA.",
            "The final prompt must describe one complete designed social asset: layout grid, photo zone, headline area, structured info blocks, proof/service cue, CTA treatment, color use, safe zones, and text placement limits.",
            "Make the image do a marketing job, not just look pretty.",
            "Choose the format a real social media manager would manually make for this post, not always a photo ad.",
            "Avoid generic flyer layout, messy collage, fake app UI, random decorative icons, text over the hero subject, tiny unreadable print, random badge stamps, or flat SVG-template output.",
            "Keep the prompt concise enough for image generation while preserving the creative direction."
          ]
        })
      }]
    }],
    text: {
      format: {
        type: "json_schema",
        name: "art_card_agent_handoff",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["marketingPlaybook", "contentScript", "imageBrief"],
          properties: {
            marketingPlaybook: {
              type: "object",
              additionalProperties: false,
              required: ["audienceInsight", "hookTopic", "contentPillar", "format", "postJob", "proofToShow", "conversionAction", "seoKeywords"],
              properties: {
                audienceInsight: { type: "string" },
                hookTopic: { type: "string" },
                contentPillar: { type: "string" },
                format: { type: "string" },
                postJob: { type: "string" },
                proofToShow: { type: "string" },
                conversionAction: { type: "string" },
                seoKeywords: {
                  type: "array",
                  minItems: 2,
                  maxItems: 8,
                  items: { type: "string" }
                }
              }
            },
            contentScript: {
              type: "object",
              additionalProperties: false,
              required: ["hook", "headline", "subline", "cta", "caption", "hierarchy", "avoid"],
              properties: {
                hook: { type: "string", maxLength: 120 },
                headline: { type: "string", maxLength: 72 },
                subline: { type: "string", maxLength: 140 },
                cta: { type: "string", maxLength: 32 },
                caption: { type: "string" },
                hierarchy: { type: "string" },
                avoid: {
                  type: "array",
                  minItems: 3,
                  maxItems: 8,
                  items: { type: "string" }
                }
              }
            },
            imageBrief: {
              type: "object",
              additionalProperties: false,
              required: ["prompt"],
              properties: {
                prompt: { type: "string", minLength: 80, maxLength: 1800 }
              }
            }
          }
        }
      }
    }
  };
}

function normalizePlatform(platform?: string): PlatformValue {
  if (platform && Object.values(Platform).includes(platform as PlatformValue)) return platform as PlatformValue;
  return Platform.INSTAGRAM;
}

export function buildAgenticDraftRules() {
  return [
    "Use a three-agent handoff for every draft.",
    "Agent 1 - Marketing Strategist: produce a manual social-media-manager brief: platform, format, goal, hook topic, content pillar, audience friction, proof cue, SEO/search keywords where useful, and safest conversion action from Brand DNA.",
    "Agent 2 - Social Content Writer: write the platform-native caption, art-card headline, art-card subline, and CTA logic from Agent 1's playbook. Keep the poster copy as simple as the user's manual examples: headline, one helpful subtext line, one CTA.",
    "Agent 3 - Art Card Image Director: choose the right visual format for the job, such as FAQ icon card, service menu, checklist, carousel cover, proof card, product/service hero, or photo-led ad. Do not force every post into a photographic hero layout.",
    "The visualDirection must include the chosen format, layout grid, visual elements or icons, text zones, proof/benefit cue, CTA treatment, brand color usage, logo placement, and safe-zone instructions.",
    "For FAQ, education, service coverage, comparison, or friction-reduction posts, prefer a clean UI/card layout with purposeful category icons or tiles when useful.",
    "Do not let Agent 3 invent new facts. It may visualize only the Brand DNA, offer/context, platform playbook, and Agent 2 copy."
  ];
}

function extractOutputText(payload: unknown) {
  const response = z.object({
    output: z.array(z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() })).optional()
  }).parse(payload);
  const text = response.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;
  if (!text) throw new Error("Art-card prompt agents did not include output_text.");
  return text;
}

function getAgentCta(input: ArtImageInput) {
  const text = `${input.headline} ${input.subline} ${input.visualDirection} ${input.offerContext ?? ""} ${input.campaignGoal ?? ""}`.toLowerCase();
  if (text.includes("book") && text.includes("pickup")) return "Book Pickup";
  if (text.includes("message") || text.includes("messenger") || text.includes("chat")) return "Message Us";
  if (text.includes("book") || text.includes("schedule") || text.includes("appointment") || text.includes("pickup")) return "Book Now";
  if (text.includes("order") || text.includes("shop") || text.includes("buy")) return "Order Now";
  if (text.includes("visit") || text.includes("store") || text.includes("location")) return "Visit Us";
  return "Learn More";
}
