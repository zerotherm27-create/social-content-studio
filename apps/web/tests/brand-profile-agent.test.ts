import { describe, expect, it, vi } from "vitest";
import { extractBrandProfile } from "@/lib/agent/brand-profile-agent";

const input = {
  brandName: "Luna Brew Cafe",
  websiteUrl: "https://luna.example",
  pageTitle: "Luna Brew Cafe",
  description: "Seasonal cold brew and neighborhood coffee.",
  pageText: "Coffee, pastries, and tasting events for the neighborhood."
};

describe("extractBrandProfile", () => {
  it("provides a useful offline profile", async () => {
    const profile = await extractBrandProfile(input, { apiKey: "", fetcher: vi.fn() });
    expect(profile.offers).toContain("Seasonal cold brew");
    expect(profile.voice).toContain("Clear");
  });

  it("parses structured profile output", async () => {
    const expected = {
      voice: "Warm and direct",
      audience: "Nearby coffee drinkers",
      offers: "Cold brew and pastries",
      visualStyle: "Natural light and tactile details",
      bannedPhrases: "guaranteed results"
    };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ output_text: JSON.stringify(expected) }) });
    await expect(extractBrandProfile(input, { apiKey: "sk-test", fetcher })).resolves.toEqual(expected);
  });

  it("falls back to a conservative profile after temporary AI connection failures", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    const profile = await extractBrandProfile(input, { apiKey: "sk-test", fetcher });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(profile.offers).toContain("Seasonal cold brew");
  });
});
