import { z } from "zod";
import { MediaType, Platform, type Platform as PlatformValue } from "../domain";
import { type GeneratedDraft, generateDrafts } from "./mock-agent";
import { buildAgenticDraftRules } from "./art-card-creative-agents";
import { buildSocialIntelligenceBrief } from "./social-intelligence";

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

export function buildOpenAIRequest(input: GenerateDraftsInput, model: string) {
  const socialIntelligence = buildSocialIntelligenceBrief(input);

  return {
    model,
    instructions:
      "You are Orbit, an autonomous social media content agent: senior strategist, platform-native social media manager, direct-response copywriter, brand guardian, publishing QA, and professional art director. Think before writing: diagnose the campaign angle, audience tension, funnel stage, platform role, creative proof, and safest next action. Then create content that the brand could realistically publish today. Return only structured JSON that matches the schema.",
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
              socialIntelligence,
              rules: [
                ...buildAgenticDraftRules(),
                "Write one draft for each requested platform.",
                "Use the supplied socialIntelligence object as your strategy brief. Do not ignore the platform playbook or quality gate.",
                "For each platform, choose a different platform-native expression of the same campaign strategy. Do not paste the same caption across channels.",
                "First decide the post job internally: stop scroll, educate, prove, convert, invite reply, drive local visit, or support rebooking. Make every field support that job.",
                "Then choose a creative format internally: FAQ post, service menu, checklist, carousel cover, problem-solution, before-after, review/proof, comparison, offer stack, founder/brand POV, process proof, customer POV, local utility, or advertorial-style static. Use the format a human social media manager would choose for the job.",
                "For friction-reduction, FAQ, service coverage, education, comparison, or local search topics, prefer the user's manual content shape: Platform, Format, Goal, Hook, Art Card Text, Caption, CTA, SEO Keywords, Image Prompt.",
                "Build the art card like a practical premium social asset, not always a photo ad: one clear headline, one helpful subtext line, one CTA, and purposeful visual proof such as icons, service tiles, checklist rows, or a photo only when it is truly useful.",
                "Keep captions specific to the platform, audience, funnel stage, and desired customer action.",
                "Lead captions with a concrete customer situation, useful benefit, offer detail, or product truth. Never lead with generic announcement language like 'Exciting news' or 'We are thrilled'.",
                "Use only prices, dates, features, proof, locations, and terms explicitly present in the source or brand context.",
                "Write like a skilled social media manager: make the first line scroll-stopping, keep the body useful and natural, and end promotional captions with one specific call to action. Do not repeat the exact CTA line from the art card unless the platform needs directness.",
                "Use 2 to 6 relevant hashtags.",
                "Use mediaType VIDEO only for TikTok unless the platform clearly benefits from video.",
                "Write a pub-mat artHeadline of 3 to 7 words. It must read like a poster headline: direct, commercial, and instantly understandable. Never use vague lines like 'Your moment starts here'.",
                "Write an artSubline of 6 to 16 words that adds a different benefit, proof point, term, deadline, location, or reason to act. Do not echo the headline.",
                "Create the visualDirection as a full premium art-card generation prompt, not a template instruction and not just a photo prompt. Include: chosen post format, layout structure, logo/brand placement, headline placement, icon/photo/tile treatment, proof elements, CTA treatment, color use, and what should remain untouched by text.",
                "Make the visualDirection describe a real brand-post composition. For example: clean FAQ-style card, logo top-left, headline 'What Can We Clean?', service icons for clothes/shoes/bedding/bags/linens, teal and yellow accents, subtext line, CTA button. Only use this example when it matches the brand evidence.",
                "For the pub mat, avoid clutter. The design should have clear hierarchy: brand, dominant visual idea, headline, supporting benefit, proof/reason, CTA. Never plan text over the main product, face, garment, food, property feature, or other hero subject.",
                "If using photography, show the product or service in a believable customer moment. If using icons or UI tiles, keep them purposeful, premium, simple, and directly tied to the services or proof.",
                "Do not put hashtags, unsupported prices, or unverifiable claims in the art card copy.",
                "Never use the brand's banned phrases.",
                "Avoid unverifiable guarantees, vague superlatives, AI copywriting clichés, and regulated claims.",
                "Before finalizing each draft, mentally run the qualityGate: if the post feels generic, unsupported, off-platform, cluttered, or unlike the brand, revise it.",
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
