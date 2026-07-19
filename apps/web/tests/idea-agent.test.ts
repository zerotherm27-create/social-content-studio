import { describe, expect, it, vi } from "vitest";
import { generateContentIdeas } from "@/lib/agent/idea-agent";

const input = {
  brandName: "Luna Brew Cafe",
  voice: "Warm, polished, and local",
  audience: "Nearby professionals and coffee lovers",
  offers: "Summer cold brew flight",
  visualStyle: "Natural light and tactile cafe details"
};

describe("generateContentIdeas", () => {
  it("creates deterministic ideas without an API key", async () => {
    const ideas = await generateContentIdeas(input, { apiKey: "", fetcher: vi.fn() });
    expect(ideas).toHaveLength(6);
    expect(ideas[0].title).toBeTruthy();
    expect(ideas.some((idea) => idea.purpose === "Behind the scenes")).toBe(true);
  });

  it("parses structured ideas from the Responses API", async () => {
    const generated = Array.from({ length: 6 }, (_, index) => ({
      title: `Idea ${index + 1}`,
      hook: `Hook ${index + 1}`,
      purpose: "Education",
      format: "Instagram carousel",
      reason: "Useful to the audience.",
      imagePrompt: "Editorial coffee photography."
    }));
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: JSON.stringify({ ideas: generated }) })
    });

    const ideas = await generateContentIdeas(input, { apiKey: "sk-test", fetcher });
    expect(ideas).toEqual(generated);
    expect(fetcher).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.objectContaining({ method: "POST" }));
  });
});
