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
              "Create six distinct content ideas in the user's manual social-media-manager style: platform, format, goal, hook, art-card text, caption intent, CTA, SEO/search keywords when useful, and image prompt.",
              "Prioritize practical content pillars a real local business would post: FAQ, service menu, pickup flow, specialty item spotlight, before/after proof, care tip, pricing/process explainer, local search intent, and message-to-book friction reduction.",
              "Each idea title should be the art-card headline or close to it, not a vague strategy phrase.",
              "Each hook should be short enough to become the art-card subtext or caption opener.",
              "The imagePrompt must describe a finished social asset. For FAQ/service/education posts, prefer clean UI/card layouts with purposeful icons, tiles, checklist rows, logo, brand colors, headline, subtext, and CTA. Use photography only when it genuinely helps proof or conversion.",
              "Use concrete service terms from Brand DNA. For laundry brands, examples include regular laundry, dry cleaning, shoes, bedding, comforters, curtains, bags, pressing, uniforms, linens, pickup, delivery, and Messenger booking.",
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
  const isLaundry = /laundry|dry clean|clothes|bedding|comforter|shoe|linen|pickup/i.test(`${input.brandName} ${input.offers} ${input.visualStyle}`);
  const ideas = isLaundry ? [
    ["What Can We Clean?", "Clothes, shoes, bedding, bags, linens, and more.", "Education", "FAQ post", "Reduces friction by answering the first question customers ask before messaging."],
    ["Laundry Pickup Made Easy", "Message us. We pick up. You get it back clean.", "Conversion", "Service flow post", "Turns pickup into a simple three-step action."],
    ["Bedding Needs Care Too", "Comforters, sheets, linens, and curtains cleaned properly.", "Education", "Service spotlight", "Pushes higher-value bulky-item inquiries with a clear service category."],
    ["Shoes Need Cleaning?", "Ask us what pairs we can handle.", "Community", "FAQ/service post", "Creates an easy message prompt for specialty-item questions."],
    ["Got A Specialty Item?", "Bags, uniforms, linens, curtains, and more.", "Conversion", "Inquiry driver", "Encourages people to ask before assuming the item cannot be cleaned."],
    ["What Happens After Pickup", "Sorting, cleaning, folding, and return made simple.", "Proof", "Process carousel cover", "Shows the service process without unsupported claims."]
  ] : [
    ["What Can We Help With?", `Ask us about ${offer} and the easiest next step.`, "Education", "FAQ post", "Reduces friction by making the service scope easy to understand."],
    ["How It Works", "One simple flow from message to result.", "Conversion", "Service flow post", "Turns the offer into a clear step-by-step action."],
    ["Before You Book", "One practical detail to know before choosing.", "Education", "Checklist post", "Gives customers a useful saveable reason to trust the brand."],
    ["Ask Us First", "Not sure what fits? Send the question.", "Community", "Question post", "Creates a low-pressure reply path for uncertain customers."],
    ["Made For Busy Days", `A simpler way to handle ${offer}.`, "Lifestyle", "Single-image art card", `Connects the offer to the real routine of ${input.audience}.`],
    ["Behind The Service", "A look at the care behind the result.", "Proof", "Process carousel cover", "Process proof builds trust without exaggerated claims."]
  ];

  return ideas.map(([title, hook, purpose, format, reason]) => ({
    title,
    hook,
    purpose,
    format,
    reason,
    imagePrompt: `${buildStrategicVisualDirection({
      ...input,
      campaignTitle: title,
      goal: purpose,
      source: reason,
      platform: format.includes("Google") ? "GOOGLE_BUSINESS" : format.includes("Threads") ? "THREADS" : "INSTAGRAM",
      base: `${input.visualStyle || "premium brand-native social creative"}. ${title}. Campaign angle: ${angle}.`
    })} Manual brief style: Platform ${format.includes("Google") ? "Google Business, Facebook, Instagram carousel" : "Facebook, Instagram carousel, Google Business"}; Format: ${format}; Goal: ${purpose}; Hook: ${hook}; Art Card Text: ${title} / ${hook} / ${getIdeaCta(title, hook)}; CTA: ${getIdeaCta(title, hook)}; Image Prompt: clean readable social card with logo, brand colors, purposeful service icons or tiles, large headline, one subtext line, and clear CTA.`
  }));
}

function getIdeaCta(title: string, hook: string) {
  const text = `${title} ${hook}`.toLowerCase();
  if (text.includes("what can") || text.includes("ask") || text.includes("specialty") || text.includes("shoe")) return "Ask Us";
  if (text.includes("pickup") || text.includes("book")) return "Book Pickup";
  if (text.includes("bedding") || text.includes("comforter")) return "Ask About Bedding";
  return "Message Us";
}

function extractOutputText(payload: unknown) {
  const response = z.object({
    output: z.array(z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() })).optional()
  }).parse(payload);
  const text = response.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI idea generation did not include output_text.");
  return text;
}
