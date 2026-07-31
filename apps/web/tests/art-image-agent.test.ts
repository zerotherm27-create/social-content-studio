import { describe, expect, it, vi } from "vitest";
import {
  buildArtImagePrompt,
  buildPremiumArtCardPrompt,
  generateArtCardPhoto,
  generatePremiumArtCardAsset,
  generatePremiumArtCardImage
} from "@/lib/agent/art-image-agent";
import { getArtCardExportFormat, normalizeArtCardPlatform } from "@/lib/draft-art-card";
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

    expect(prompt).toContain("Create one complete, finished modern corporate social-media poster/art card");
    expect(prompt).toContain("Canva-style corporate flyer");
    expect(prompt).toContain("modern corporate promotional poster with a clean infographic and photo-composite style");
    expect(prompt).toContain("Follow this exact poster blueprint");
    expect(prompt).toContain("55/45 split composition");
    expect(prompt).toContain("curved split-layout design");
    expect(prompt).toContain("editorial infographic structure");
    expect(prompt).toContain("each supplied text item may appear once only");
    expect(prompt).toContain("Audience and context discipline");
    expect(prompt).toContain("do not create any large footer panel");
    expect(prompt).toContain("Do not create a black card");
    expect(prompt).toContain("blank card");
    expect(prompt).toContain("rounded panels, circles, pill labels");
    expect(prompt).toContain("structured infographic panels, useful icons, or service tiles");
    expect(prompt).toContain("Keep all text large and readable");
    expect(prompt).toContain("Do not add generic labels");
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
                contentPillar: "FAQ",
                format: "FAQ post",
                postJob: "remove booking friction",
                proofToShow: "pickup bag at the door",
                conversionAction: "book pickup",
                seoKeywords: ["laundry service Metro Manila", "dry cleaning Metro Manila"]
              },
              contentScript: {
                hook: "Can we clean that? Most likely, yes.",
                headline: "Book in Minutes via Messenger",
                subline: "Need laundry picked up today? Send us a message and book in minutes.",
                cta: "Book Pickup",
                caption: "Not sure if your item can be cleaned? Ask us.",
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

  it("returns the master art-card asset with the prompt that generated it", async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/responses")) {
        return {
          ok: true,
          json: async () => ({
            output_text: JSON.stringify({
              marketingPlaybook: {
                audienceInsight: "Busy customers need immediate proof.",
                hookTopic: "pickup clarity",
                contentPillar: "conversion",
                format: "single image art card",
                postJob: "drive booking",
                proofToShow: "folded laundry pickup bag",
                conversionAction: "book pickup",
                seoKeywords: ["laundry pickup", "wash dry fold"]
              },
              contentScript: {
                hook: "Fresh laundry without the errand.",
                headline: "Book in Minutes via Messenger",
                subline: "Need laundry picked up today? Send us a message and book in minutes.",
                cta: "Book Pickup",
                caption: "Book pickup in minutes.",
                hierarchy: "Logo, headline, service proof, CTA.",
                avoid: ["fake badges", "tiny text", "crowded layout"]
              },
              imageBrief: {
                prompt: "Traceable premium prompt for one finished branded laundry pickup art card with clear safe zones and readable poster copy."
              }
            })
          })
        };
      }

      return {
        ok: true,
        json: async () => ({ data: [{ b64_json: "asset123" }] })
      };
    });

    const asset = await generatePremiumArtCardAsset(input, {
      apiKey: "sk-test",
      model: "gpt-image-2",
      fetcher
    });

    expect(asset).toEqual(expect.objectContaining({
      dataUrl: "data:image/png;base64,asset123",
      model: "gpt-image-2"
    }));
    expect(asset?.prompt).toContain("Traceable premium prompt");
  });

  it("builds a three-agent prompt-planning request before image generation", () => {
    const request = buildArtCardPromptAgentRequest(input, "gpt-5.4-mini");
    const payload = JSON.parse(request.input[0].content[0].text);

    expect(request.instructions).toContain("Agent 1, Marketing Strategist");
    expect(request.instructions).toContain("Agent 2, Social Copy and Prompt Writer");
    expect(request.instructions).toContain("Agent 3, Image Director");
    expect(payload.brandDNA.brandName).toBe("The Laundry Project");
    expect(payload.preferredManualBriefShape.format).toBe("Photo-composite corporate poster / Canva-style social artcard");
    expect(payload.preferredManualBriefShape.imagePromptStyle).toContain("55/45 split composition");
    expect(payload.preferredManualBriefShape.imagePromptStyle).toContain("no duplicate footer text");
    expect(payload.handoffRules.join(" ")).toContain("modern corporate poster layout");
    expect(payload.handoffRules.join(" ")).toContain("headline once");
    expect(payload.handoffRules.join(" ")).toContain("guide visuals only");
    expect(payload.handoffRules.join(" ")).toContain("Do not create a large bottom banner");
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

  it("maps platform export options without requiring another image generation", () => {
    expect(normalizeArtCardPlatform("reels")).toBe("INSTAGRAM_STORY");
    expect(normalizeArtCardPlatform("google")).toBe("GOOGLE_BUSINESS");
    expect(normalizeArtCardPlatform("1:1")).toBe("SQUARE");
    expect(getArtCardExportFormat("STORY")).toMatchObject({ width: 1080, height: 1920 });
    expect(getArtCardExportFormat("GOOGLE_BUSINESS")).toMatchObject({ width: 1200, height: 900 });
    expect(getArtCardExportFormat("FACEBOOK")).toMatchObject({ width: 1080, height: 1350 });
  });
});
