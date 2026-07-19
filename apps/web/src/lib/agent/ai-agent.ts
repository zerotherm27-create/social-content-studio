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
      "You are a senior direct-response creative strategist and social copywriter. Turn the supplied facts into campaign-ready marketing, not generic inspirational content. Every draft must communicate one offer, one customer benefit, and one clear next step while staying truthful to the source. Return only structured JSON that matches the schema.",
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
                "Choose the single strongest marketing angle for the stated audience and goal; do not combine multiple messages.",
                "Keep captions specific to the platform, audience, funnel stage, and desired customer action.",
                "Lead captions with a concrete customer situation, useful benefit, offer detail, or product truth—not a generic announcement.",
                "Use only prices, dates, features, proof, locations, and terms explicitly present in the source or brand context.",
                "End promotional captions with one natural, specific call to action. Do not repeat the same line from the art card.",
                "Use 2 to 6 relevant hashtags.",
                "Use mediaType VIDEO only for TikTok unless the platform clearly benefits from video.",
                "Write a punchy artHeadline of 3 to 7 words. It must make the offer, problem, transformation, or occasion immediately clear; never reuse the campaign title unless it already does that job.",
                "Write an artSubline of 6 to 16 words that adds a distinct benefit, proof point, term, or reason to act. Do not echo the headline.",
                "Create a concrete visualDirection for a commercial photographer: specify the hero subject, action, setting, crop, brand-color placement, and intentional negative space for copy.",
                "Show the product or service being used in a believable customer moment. Avoid generic smiling portraits, mood-only imagery, collages, floating graphics, fake UI, and text inside the scene.",
                "Do not put hashtags, unsupported prices, or unverifiable claims in the art card copy.",
                "Never use the brand's banned phrases.",
                "Avoid unverifiable guarantees, vague superlatives, AI copywriting clichés, and regulated claims.",
                "Facebook should feel human and community-aware; Instagram should be visually sharp and saveable; Google Business should prioritize local intent and immediate action; Threads should feel conversational; TikTok should open with motion; LinkedIn should lead with useful business relevance."
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
