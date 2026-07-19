import { describe, expect, it, vi } from "vitest";
import { MediaType, Platform } from "@/lib/domain";
import { buildOpenAIRequest, generateAgentDrafts, parseOpenAIResponseText } from "@/lib/agent/ai-agent";

const baseInput = {
  brandName: "Luna Brew Cafe",
  voice: "Warm and premium",
  audience: "busy professionals",
  campaignTitle: "Summer cold brew flight",
  goal: "Launch a new product",
  source: "Three new cold brew flavors with a first-week discount.",
  offers: "Cold brew flight",
  visualStyle: "Editorial product photography",
  bannedPhrases: "best in the city",
  tone: "Warm",
  creativeDirection: "Natural afternoon light and tactile ingredients",
  platforms: [Platform.FACEBOOK, Platform.GOOGLE_BUSINESS]
};

describe("generateAgentDrafts", () => {
  it("falls back to deterministic drafts when no OpenAI API key is configured", async () => {
    const drafts = await generateAgentDrafts(baseInput, {
      apiKey: "",
      fetcher: vi.fn()
    });

    expect(drafts).toHaveLength(2);
    expect(drafts[0].caption).toContain("Luna Brew Cafe");
    expect(drafts[1].platform).toBe(Platform.GOOGLE_BUSINESS);
  });

  it("uses the OpenAI Responses API when an API key is configured", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          drafts: [
            {
              platform: Platform.FACEBOOK,
              caption: "Fresh AI copy for Facebook.",
              mediaType: MediaType.IMAGE,
              hashtags: ["#luna", "#coldbrew"],
              artHeadline: "Meet the summer flight",
              artSubline: "Three cold brews made for slow afternoons.",
              visualDirection: "Three glasses in natural afternoon light."
            },
            {
              platform: Platform.GOOGLE_BUSINESS,
              caption: "Fresh AI copy for Google Business Profile.",
              mediaType: MediaType.IMAGE,
              hashtags: ["#local", "#coffee"],
              artHeadline: "A cooler coffee break",
              artSubline: "Try the new flight this week.",
              visualDirection: "A clean counter scene with the flight centered."
            }
          ]
        })
      })
    });

    const drafts = await generateAgentDrafts(baseInput, {
      apiKey: "sk-test",
      model: "gpt-5.4-mini",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test"
        })
      })
    );
    expect(drafts[0].caption).toBe("Fresh AI copy for Facebook.");
  });

  it("sends a structured social intelligence brief to the model", () => {
    const request = buildOpenAIRequest(baseInput, "gpt-5.4-mini");
    const text = request.input[0].content[0].text;
    const payload = JSON.parse(text);

    expect(request.instructions).toContain("autonomous social media content agent");
    expect(payload.socialIntelligence.agentMode).toContain("publishing QA");
    expect(payload.socialIntelligence.campaignStrategy.angle).toBe("offer");
    expect(payload.socialIntelligence.platformPlaybooks.FACEBOOK.openingMove).toBeTruthy();
    expect(payload.rules).toContain("Use the supplied socialIntelligence object as your strategy brief. Do not ignore the platform playbook or quality gate.");
    expect(payload.rules.join(" ")).toContain("Before finalizing each draft");
  });
});

describe("parseOpenAIResponseText", () => {
  it("parses structured JSON from output_text", () => {
    const drafts = parseOpenAIResponseText(
      JSON.stringify({
        drafts: [
          {
            platform: Platform.LINKEDIN,
            caption: "A professional launch note.",
            mediaType: MediaType.TEXT,
            hashtags: ["#launch"],
            artHeadline: "A useful launch",
            artSubline: "Built from a real customer need.",
            visualDirection: "Editorial typographic art card."
          }
        ]
      })
    );

    expect(drafts).toEqual([
      {
        platform: Platform.LINKEDIN,
        caption: "A professional launch note.",
        mediaType: MediaType.TEXT,
        hashtags: ["#launch"],
        artHeadline: "A useful launch",
        artSubline: "Built from a real customer need.",
        visualDirection: "Editorial typographic art card."
      }
    ]);
  });
});
