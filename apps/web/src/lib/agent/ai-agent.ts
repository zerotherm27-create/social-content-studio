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
  platforms: PlatformValue[];
};

type AgentOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

const generatedDraftSchema = z.object({
  platform: z.enum([Platform.FACEBOOK, Platform.INSTAGRAM, Platform.GOOGLE_BUSINESS, Platform.TIKTOK, Platform.LINKEDIN]),
  caption: z.string().min(1),
  mediaType: z.enum([MediaType.TEXT, MediaType.IMAGE, MediaType.VIDEO]),
  hashtags: z.array(z.string().min(1)).min(1).max(8)
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
    const message = await response.text();
    throw new Error(`OpenAI generation failed: ${response.status} ${message}`);
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
      "You are a careful social media content agent. Generate concise, platform-specific drafts that match the brand memory. Return only structured JSON that matches the schema.",
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
                audience: input.audience
              },
              campaign: {
                title: input.campaignTitle,
                goal: input.goal,
                source: input.source
              },
              platforms: input.platforms,
              rules: [
                "Write one draft for each requested platform.",
                "Keep captions specific to the platform and audience.",
                "Use 2 to 6 relevant hashtags.",
                "Use mediaType VIDEO only for TikTok unless the platform clearly benefits from video.",
                "Avoid unverifiable guarantees and regulated claims."
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
                required: ["platform", "caption", "mediaType", "hashtags"],
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
                  }
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
