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
    postJob: z.string().min(2),
    proofToShow: z.string().min(2),
    conversionAction: z.string().min(2)
  }),
  contentScript: z.object({
    headline: z.string().min(1).max(72),
    subline: z.string().min(1).max(140),
    cta: z.string().min(1).max(32),
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
      "Agent 1, Marketing Strategist: choose the hook topic, customer tension, post job, proof, and conversion playbook from Brand DNA.",
      "Agent 2, Social Copy and Prompt Writer: turn the strategy into exact poster copy, hierarchy, and art-direction constraints.",
      "Agent 3, Image Director: write the final image-generation prompt for a finished premium art card.",
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
            "The final prompt must describe one complete designed ad image: layout grid, hero scene, typography treatment, proof cue, CTA treatment, color use, and safe zones.",
            "Make the image do a marketing job, not just look pretty.",
            "Choose a real customer moment or product/service proof scene aligned to the Brand DNA.",
            "Avoid generic flyer layout, collage, fake UI, floating icons, text over the hero subject, tiny unreadable print, and random badge stamps.",
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
              required: ["audienceInsight", "hookTopic", "postJob", "proofToShow", "conversionAction"],
              properties: {
                audienceInsight: { type: "string" },
                hookTopic: { type: "string" },
                postJob: { type: "string" },
                proofToShow: { type: "string" },
                conversionAction: { type: "string" }
              }
            },
            contentScript: {
              type: "object",
              additionalProperties: false,
              required: ["headline", "subline", "cta", "hierarchy", "avoid"],
              properties: {
                headline: { type: "string", maxLength: 72 },
                subline: { type: "string", maxLength: 140 },
                cta: { type: "string", maxLength: 32 },
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
    "Agent 1 - Marketing Strategist: pick the hook topic, content job, audience tension, proof cue, funnel stage, platform playbook, and safest conversion action from Brand DNA.",
    "Agent 2 - Social Content Writer: write the platform-native caption, art headline, art subline, and CTA logic from Agent 1's playbook. Keep the poster copy short and concrete.",
    "Agent 3 - Art Card Image Director: write visualDirection as the image-generation brief that will be handed to the art-card generator. It must synthesize Agents 1 and 2 into one complete premium ad composition.",
    "The visualDirection must include layout grid, hero subject, customer/service moment, text zones, proof/benefit cue, CTA treatment, color usage, and safe-zone instructions.",
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
