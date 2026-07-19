import { z } from "zod";
import { MediaType, Platform, type Platform as PlatformValue } from "../domain";
import { type GeneratedDraft, generateDrafts } from "./mock-agent";

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

type AgentOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

const generatedDraftSchema = z.object({
  platform: z.enum([Platform.FACEBOOK, Platform.INSTAGRAM, Platform.THREADS, Platform.GOOGLE_BUSINESS, Platform.TIKTOK, Platform.LINKEDIN]),
  caption: z.string().min(1),
  mediaType: z.enum([MediaType.TEXT, MediaType.IMAGE, MediaType.VIDEO]),
  hashtags: z.array(z.string().min(1)).min(1).max(8),
  artHeadline: z.string().min(1).max(72),
  artSubline: z.string().min(1).max(140),
  visualDirection: z.string().min(1).max(500)
});

const generatedDraftsSchema = z.object({
  drafts: z.array(generatedDraftSchema).min(1)
});

export async function generateAgentDrafts(input: GenerateDraftsInput, options: AgentOptions = {}): Promise<GeneratedDraft[]> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return generateDrafts(input);
  }

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildOpenAIRequest(input, options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini"))
  });

  if (!response.ok) {
    throw new Error(`AI draft generation failed with status ${response.status}. Please try again.`);
  }

  const payload = await response.json();
  const outputText = typeof payload.output_text === "string" ? payload.output_text : extractOutputText(payload);
  return parseOpenAIResponseText(outputText);
}

export function parseOpenAIResponseText(outputText: string): GeneratedDraft[] {
  const parsed = generatedDraftsSchema.parse(JSON.parse(outputText));
  return parsed.drafts;
}

function buildOpenAIRequest(input: GenerateDraftsInput, model: string) {
  return {
    model,
    instructions:
      "You are Orbit's senior social media creator, direct-response copywriter, and professional graphic-design art director. Your first job is to infer the brand's existing posting system from Brand DNA: recurring layouts, logo use, headline style, CTA treatment, proof blocks, colors, photo style, and service/product motifs. Then create a campaign-specific art-card concept that feels like the brand would actually post it. Every draft must communicate one offer, one customer benefit, one visual idea, and one clear next step while staying truthful to the source. Return only structured JSON that matches the schema.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              brand: {
                name: input.brandName,
                voice: input.voice,
                audience: input.audience,
                offers: input.offers,
                visualStyle: input.visualStyle,
                bannedPhrases: input.bannedPhrases
              },
              campaign: {
                title: input.campaignTitle,
                goal: input.goal,
                source: input.source,
                tone: input.tone,
                creativeDirection: input.creativeDirection
              },
              platforms: input.platforms,
              rules: [
                "Write one draft for each requested platform.",
                "First decide the campaign angle internally: booking, limited offer, launch, local visit, property inquiry, event, useful guide, or social proof. Make every field support that same angle.",
                "Then choose a static-ad format internally: problem-solution, before-after, review/proof, comparison, offer stack, founder/brand POV, or advertorial-style static. Use the format that best fits the brand's actual post style and the available facts.",
                "Build the art card like a brand-native mobile feed ad, not a generic flyer: one dominant hero visual, one hook, one proof or offer detail, and one CTA. Avoid extra body copy on the image.",
                "Keep captions specific to the platform, audience, funnel stage, and desired customer action.",
                "Lead captions with a concrete customer situation, useful benefit, offer detail, or product truth. Never lead with generic announcement language like 'Exciting news' or 'We are thrilled'.",
                "Use only prices, dates, features, proof, locations, and terms explicitly present in the source or brand context.",
                "Write like a skilled social media manager: make the first line scroll-stopping, keep the body useful and natural, and end promotional captions with one specific call to action. Do not repeat the exact CTA line from the art card.",
                "Use 2 to 6 relevant hashtags.",
                "Use mediaType VIDEO only for TikTok unless the platform clearly benefits from video.",
                "Write a pub-mat artHeadline of 3 to 7 words. It must read like a poster headline: direct, commercial, and instantly understandable. Never use vague lines like 'Your moment starts here'.",
                "Write an artSubline of 6 to 16 words that adds a different benefit, proof point, term, deadline, location, or reason to act. Do not echo the headline.",
                "Create the visualDirection as a full art-card concept prompt, not just a photo prompt. Include: chosen ad format, layout structure, logo placement, headline placement, product/photo treatment, proof elements, CTA treatment, color use, and what should remain untouched by text.",
                "Make the visualDirection describe a real brand-post composition. For example: white canvas, brand logo top-left, large stacked headline on left, product/service hero on right, before/after proof circles, yellow CTA button, teal footer trust bar. Only use this example when it matches the brand evidence.",
                "For the pub mat, avoid clutter. The design should have clear hierarchy: brand, dominant visual idea, headline, supporting benefit, proof/reason, CTA. Never plan text over the main product, face, garment, food, property feature, or other hero subject.",
                "Show the product or service being used in a believable customer moment. Avoid generic smiling portraits, mood-only imagery, collages, floating graphics, fake UI, and text inside the generated scene.",
                "Do not put hashtags, unsupported prices, or unverifiable claims in the art card copy.",
                "Never use the brand's banned phrases.",
                "Avoid unverifiable guarantees, vague superlatives, AI copywriting clichés, and regulated claims.",
                "Facebook should feel human, local, and community-aware with a clear reason to respond.",
                "Instagram should be visual, concise, saveable, and benefit-led. The art headline should be especially strong here.",
                "Google Business should prioritize local search intent, opening/booking/order action, and exact practical details.",
                "Threads should sound conversational and invite a reply without being needy.",
                "TikTok should open with motion, contrast, and a visible before/after or process moment.",
                "LinkedIn should lead with useful business relevance, operational benefit, or customer insight."
              ]
            })
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "social_drafts",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["drafts"],
          properties: {
            drafts: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["platform", "caption", "mediaType", "hashtags", "artHeadline", "artSubline", "visualDirection"],
                properties: {
                  platform: {
                    type: "string",
                    enum: input.platforms
                  },
                  caption: {
                    type: "string"
                  },
                  mediaType: {
                    type: "string",
                    enum: [MediaType.TEXT, MediaType.IMAGE, MediaType.VIDEO]
                  },
                  hashtags: {
                    type: "array",
                    minItems: 1,
                    maxItems: 8,
                    items: {
                      type: "string"
                    }
                  },
                  artHeadline: { type: "string", maxLength: 72 },
                  artSubline: { type: "string", maxLength: 140 },
                  visualDirection: { type: "string", maxLength: 500 }
                }
              }
            }
          }
        }
      }
    }
  };
}

function extractOutputText(payload: unknown) {
  const response = z
    .object({
      output: z
        .array(
          z.object({
            content: z
              .array(
                z.object({
                  type: z.string(),
                  text: z.string().optional()
                })
              )
              .optional()
          })
        )
        .optional()
    })
    .parse(payload);

  const text = response.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;
  if (!text) {
    throw new Error("OpenAI generation did not include output_text.");
  }
  return text;
}
