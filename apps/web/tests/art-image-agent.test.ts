import { describe, expect, it, vi } from "vitest";
import { buildArtImagePrompt, generateArtCardPhoto } from "@/lib/agent/art-image-agent";

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
    expect(fetcher.mock.calls[0][1].body).toContain("\"size\":\"1024x1536\"");
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
