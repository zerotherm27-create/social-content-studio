import { describe, expect, it, vi } from "vitest";
import {
  buildArtImagePrompt,
  buildPremiumArtCardPrompt,
  generateArtCardPhoto,
  generatePremiumArtCardImage
} from "@/lib/agent/art-image-agent";
import { buildArtCardPromptAgentRequest } from "@/lib/agent/art-card-creative-agents";

const input = {
  brandName: "The Laundry Project",
  headline: "Book in Minutes via Messenger",
  subline: "Need laundry picked up today? Send us a message and book in minutes.",
  visualDirection: "Clean laundry pickup scene with a branded delivery bag.",
  platform: "FACEBOOK",
  brandColor: "#1266cc",
  accentColor: "#44aa55",
  websiteHost: "thelaundryproject.ph"
};

describe("art image generation", () => {
  it("builds a premium full-art-card prompt instead of a template prompt", () => {
    const prompt = buildPremiumArtCardPrompt(input);

    expect(prompt).toContain("finished premium social-media art card");
    expect(prompt).toContain("not a template, not an SVG");
    expect(prompt).toContain("Design the full art card yourself");
    expect(prompt).toContain("Avoid overlap");
    expect(prompt).toContain("Do not add generic stamps");
    expect(prompt).toContain("Main headline text, exact spelling: Book in Minutes via Messenger.");
    expect(prompt).toContain("Supporting line text, exact spelling: Need laundry picked up today?");
    expect(prompt).toContain("CTA text: Book Pickup.");
  });

  it("builds a realistic photo prompt without requesting rendered text", () => {
    const prompt = buildArtImagePrompt(input);

    expect(prompt).toContain("premium paid social ad image");
    expect(prompt).toContain("4:5 social feed crop");
    expect(prompt).toContain("Publishing platform: FACEBOOK");
    expect(prompt).toContain("Do not include readable text");
    expect(prompt).toContain("no floating icons");
    expect(prompt).toContain("no split panels");
    expect(prompt).toContain("Avoid black backgrounds");
    expect(prompt).toContain("Use #1266cc as the main brand-color accent");
    expect(prompt).toContain("Use #44aa55 as a secondary accent");
    expect(prompt).toContain("Clean laundry pickup scene");
  });

  it("returns a generated image data URL from the Images API", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ b64_json: "abc123" }] })
    });

    const image = await generateArtCardPhoto(input, {
      apiKey: "sk-test",
      model: "gpt-image-2",
      fetcher
    });

    expect(image).toBe("data:image/jpeg;base64,abc123");
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.openai.com/v1/images/generations",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer sk-test" }),
        body: expect.stringContaining("\"model\":\"gpt-image-2\"")
      })
    );
    expect(fetcher.mock.calls[0][1].body).toContain("\"size\":\"1088x1360\"");
  });

  it("returns a full premium PNG art card from the Images API", async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/responses")) {
        return {
          ok: true,
          json: async () => ({
            output_text: JSON.stringify({
              marketingPlaybook: {
                audienceInsight: "Busy households need the booking action to feel immediate.",
                hookTopic: "same-day pickup clarity",
                postJob: "remove booking friction",
                proofToShow: "pickup bag at the door",
                conversionAction: "book pickup"
              },
              contentScript: {
                headline: "Book in Minutes via Messenger",
                subline: "Need laundry picked up today? Send us a message and book in minutes.",
                cta: "Book Pickup",
                hierarchy: "Brand top, headline left, hero pickup scene right, CTA bottom.",
                avoid: ["fake discounts", "crowded collage", "text over hands"]
              },
              imageBrief: {
                prompt: "Refined premium art-card prompt from the internal Orbit agents: build a clean 4:5 paid-social laundry pickup ad with brand lockup, headline zone, proof cue, CTA, and a realistic door pickup hero scene."
              }
            })
          })
        };
      }

      return {
        ok: true,
        json: async () => ({ data: [{ b64_json: "premium123" }] })
      };
    });

    const image = await generatePremiumArtCardImage(input, {
      apiKey: "sk-test",
      model: "gpt-image-2",
      fetcher
    });

    expect(image).toBe("data:image/png;base64,premium123");
    const body = JSON.parse(fetcher.mock.calls[1][1].body as string);
    expect(body).toMatchObject({
      model: "gpt-image-2",
      size: "1088x1360",
      quality: "high",
      output_format: "png",
      background: "opaque",
      n: 1
    });
    expect(body.prompt).toContain("Refined premium art-card prompt from the internal Orbit agents");
  });

  it("builds a three-agent prompt-planning request before image generation", () => {
    const request = buildArtCardPromptAgentRequest(input, "gpt-5.4-mini");
    const payload = JSON.parse(request.input[0].content[0].text);

    expect(request.instructions).toContain("Agent 1, Marketing Strategist");
    expect(request.instructions).toContain("Agent 2, Social Copy and Prompt Writer");
    expect(request.instructions).toContain("Agent 3, Image Director");
    expect(payload.brandDNA.brandName).toBe("The Laundry Project");
    expect(payload.handoffRules.join(" ")).toContain("complete designed ad image");
  });

  it("uses a landscape image generation size for Google Business posts", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ b64_json: "landscape" }] })
    });

    await generateArtCardPhoto({ ...input, platform: "GOOGLE_BUSINESS" }, {
      apiKey: "sk-test",
      fetcher
    });

    expect(fetcher.mock.calls[0][1].body).toContain("\"size\":\"1536x1024\"");
  });
});
