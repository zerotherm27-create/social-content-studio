import { z } from "zod";

export type ExtractedBrandProfile = {
  voice: string;
  audience: string;
  offers: string;
  visualStyle: string;
  bannedPhrases: string;
};

type ProfileInput = {
  brandName: string;
  websiteUrl: string;
  pageTitle: string;
  description: string;
  pageText: string;
};

type ProfileOptions = { apiKey?: string; model?: string; fetcher?: typeof fetch };

const profileSchema = z.object({
  voice: z.string().min(3),
  audience: z.string().min(3),
  offers: z.string().min(3),
  visualStyle: z.string().min(3),
  bannedPhrases: z.string()
});

export async function extractBrandProfile(input: ProfileInput, options: ProfileOptions = {}): Promise<ExtractedBrandProfile> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return mockProfile(input);

  const fetcher = options.fetcher ?? fetch;
  const request = {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      instructions: "Extract a conservative Brand DNA profile from supplied website evidence. Separate evidence from inference. Do not invent guarantees, customers, prices, or certifications. Return only schema-valid JSON.",
      input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify(input) }] }],
      text: {
        format: {
          type: "json_schema",
          name: "brand_profile",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["voice", "audience", "offers", "visualStyle", "bannedPhrases"],
            properties: {
              voice: { type: "string" },
              audience: { type: "string" },
              offers: { type: "string" },
              visualStyle: { type: "string" },
              bannedPhrases: { type: "string" }
            }
          }
        }
      }
    })
  } satisfies RequestInit;

  let response: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetcher("https://api.openai.com/v1/responses", request);
      if (response.ok || (response.status < 500 && response.status !== 429)) break;
    } catch {
      response = undefined;
    }
  }

  // Website evidence is still useful when the AI provider has a temporary
  // network, rate-limit, or server failure, so return a conservative draft.
  if (!response || response.status === 429 || response.status >= 500) return mockProfile(input);

  if (!response.ok) throw new Error(`Brand extraction failed: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  const outputText = typeof payload.output_text === "string" ? payload.output_text : extractOutputText(payload);
  return profileSchema.parse(JSON.parse(outputText));
}

function mockProfile(input: ProfileInput): ExtractedBrandProfile {
  const summary = input.description || input.pageText.slice(0, 220);
  return {
    voice: `Clear, helpful, and specific. Use the language found on ${input.pageTitle || input.brandName}'s website without copying long passages.`,
    audience: `People looking for ${summary || input.brandName}.`,
    offers: summary || `Products and services presented on ${input.websiteUrl}.`,
    visualStyle: "Use the website's established colors, product imagery, and photographic treatment as the creative reference.",
    bannedPhrases: "guaranteed results, miracle, risk-free"
  };
}

function extractOutputText(payload: unknown) {
  const response = z.object({ output: z.array(z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() })).optional() }).parse(payload);
  const text = response.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI brand extraction did not include output_text.");
  return text;
}
