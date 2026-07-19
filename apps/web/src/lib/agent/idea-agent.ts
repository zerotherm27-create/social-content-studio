import { z } from "zod";

export type IdeaGenerationInput = {
  brandName: string;
  voice: string;
  audience: string;
  offers: string;
  visualStyle: string;
};

export type GeneratedIdea = {
  title: string;
  hook: string;
  purpose: string;
  format: string;
  reason: string;
  imagePrompt: string;
};

type IdeaAgentOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

const ideaSchema = z.object({
  title: z.string().min(2),
  hook: z.string().min(2),
  purpose: z.string().min(2),
  format: z.string().min(2),
  reason: z.string().min(2),
  imagePrompt: z.string().min(2)
});

const ideasSchema = z.object({ ideas: z.array(ideaSchema).min(4).max(8) });

export async function generateContentIdeas(input: IdeaGenerationInput, options: IdeaAgentOptions = {}): Promise<GeneratedIdea[]> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return generateMockIdeas(input);

  const response = await (options.fetcher ?? fetch)("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      instructions: "You are a senior social content strategist. Propose specific, varied, brand-safe content ideas. Return only schema-valid JSON.",
      input: [{
        role: "user",
        content: [{
          type: "input_text",
          text: JSON.stringify({
            brand: input,
            task: "Create six distinct ideas across promotional, educational, community, lifestyle, and behind-the-scenes purposes. Use concrete hooks and platform-native formats. Avoid unverifiable claims."
          })
        }]
      }],
      text: {
        format: {
          type: "json_schema",
          name: "content_ideas",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["ideas"],
            properties: {
              ideas: {
                type: "array",
                minItems: 6,
                maxItems: 6,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "hook", "purpose", "format", "reason", "imagePrompt"],
                  properties: {
                    title: { type: "string" },
                    hook: { type: "string" },
                    purpose: { type: "string" },
                    format: { type: "string" },
                    reason: { type: "string" },
                    imagePrompt: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    })
  });

  if (!response.ok) throw new Error(`AI idea generation failed with status ${response.status}. Please try again.`);
  const payload = await response.json();
  const outputText = typeof payload.output_text === "string" ? payload.output_text : extractOutputText(payload);
  return ideasSchema.parse(JSON.parse(outputText)).ideas;
}

export function generateMockIdeas(input: IdeaGenerationInput): GeneratedIdea[] {
  const offer = input.offers.split(",")[0]?.trim() || "the current offer";
  return [
    ["Make the offer clear", `What should customers know first about ${offer}?`, "Offer launch", "Instagram carousel", "Makes the current offer easy to understand at a glance."],
    ["Show how the work gets done", "The details customers rarely get to see.", "Behind the scenes", "Short-form video", "Process-led content adds proof without another sales claim."],
    ["Connect to a real routine", "A familiar customer moment, made easier.", "Lifestyle", "Instagram reel", `Connects ${offer} to the routine of ${input.audience}.`],
    ["Let customers choose", "Which detail matters most to you?", "Community", "Facebook post", "A specific choice prompt can create useful comments."],
    ["Teach one useful detail", "One practical thing to know before choosing this service.", "Education", "Instagram carousel", "A useful guide gives people a reason to save the post."],
    ["Make the next step easy", `A simple way to act on ${offer}.`, "Customer action", "Google Business update", "Turns awareness into a clear customer action."]
  ].map(([title, hook, purpose, format, reason]) => ({
    title,
    hook,
    purpose,
    format,
    reason,
    imagePrompt: `${input.visualStyle || "Natural editorial brand photography"}. ${title}. No text or watermark.`
  }));
}

function extractOutputText(payload: unknown) {
  const response = z.object({
    output: z.array(z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() })).optional()
  }).parse(payload);
  const text = response.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI idea generation did not include output_text.");
  return text;
}
