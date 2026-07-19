import { z } from "zod";
import { buildSocialIntelligenceBrief, buildStrategicVisualDirection, inferCampaignAngle } from "./social-intelligence";

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
  const socialIntelligence = buildSocialIntelligenceBrief(input);

  const response = await (options.fetcher ?? fetch)("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      instructions: "You are Orbit, a senior social media strategy agent. Build content ideas like a working social media manager: diagnose audience tension, campaign angle, content pillar, platform behavior, visual proof, and next action. Propose specific, varied, brand-safe ideas that can become real posts. Return only schema-valid JSON.",
      input: [{
        role: "user",
        content: [{
          type: "input_text",
          text: JSON.stringify({
            brand: input,
            socialIntelligence,
            task: [
              "Create six distinct content ideas across conversion, proof, education, community, lifestyle, and behind-the-scenes purposes.",
              "Each idea must have a clear audience insight, a post job, and a format that a real social media manager would choose.",
              "Use concrete hooks, not generic topic labels.",
              "The imagePrompt must be a premium brand-native art-card or video-cover direction, not a stock photo prompt.",
              "Avoid unverifiable claims, generic stamps, and template language."
            ]
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
  const angle = inferCampaignAngle(input);
  const ideas = [
    ["Make the offer instantly clear", `What should customers understand first about ${offer}?`, "Conversion", "Instagram single-image art card", "Turns the offer into one clear promise and one next step."],
    ["Prove the process", "Show the work customers usually do not see.", "Behind the scenes", "Short-form video or reel cover", "Process proof builds trust without needing exaggerated claims."],
    ["Fit the customer routine", `Where does ${offer} naturally fit into a normal week?`, "Lifestyle", "Instagram reel or Facebook image post", `Connects the offer to the real routine of ${input.audience}.`],
    ["Invite a useful reply", "Ask which detail would make the service easier to choose.", "Community", "Facebook or Threads prompt", "Specific choice prompts create better comments than broad engagement bait."],
    ["Teach one buying detail", "One practical thing to know before choosing this service.", "Education", "Saveable carousel", "A useful guide gives people a reason to save and trust the brand."],
    ["Remove action friction", `The simplest way to act on ${offer}.`, "Customer action", "Google Business update", "Makes the next step obvious for high-intent customers."]
  ];

  return ideas.map(([title, hook, purpose, format, reason]) => ({
    title,
    hook,
    purpose,
    format,
    reason,
    imagePrompt: buildStrategicVisualDirection({
      ...input,
      campaignTitle: title,
      goal: purpose,
      source: reason,
      platform: format.includes("Google") ? "GOOGLE_BUSINESS" : format.includes("Threads") ? "THREADS" : "INSTAGRAM",
      base: `${input.visualStyle || "premium brand-native social creative"}. ${title}. Campaign angle: ${angle}.`
    })
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
