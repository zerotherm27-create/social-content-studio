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
    expect(ideas.some((idea) => idea.format.includes("FAQ"))).toBe(true);
    expect(ideas.some((idea) => idea.purpose === "Proof")).toBe(true);
    expect(ideas[0].imagePrompt).toContain("Campaign angle:");
    expect(ideas[0].imagePrompt).toContain("Manual brief style");
    expect(ideas[0].imagePrompt).toContain("purposeful service icons or tiles");
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
    const body = JSON.parse(fetcher.mock.calls[0][1].body as string);
    const promptPayload = JSON.parse(body.input[0].content[0].text);
    expect(body.instructions).toContain("social media strategy agent");
    expect(promptPayload.socialIntelligence.qualityGate).toContain("Would a real social media manager post this for the brand?");
    expect(promptPayload.task.join(" ")).toContain("manual social-media-manager style");
    expect(promptPayload.task.join(" ")).toContain("clean UI/card layouts");
  });
});
