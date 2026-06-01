import { describe, expect, it } from "vitest";
import { MediaType, Platform } from "@/lib/domain";
import { generateDrafts } from "@/lib/agent/mock-agent";

describe("generateDrafts", () => {
  it("creates one platform-specific draft per selected platform", () => {
    const drafts = generateDrafts({
      brandName: "Luna Brew Cafe",
      voice: "Warm and premium",
      audience: "busy professionals",
      campaignTitle: "Summer cold brew flight",
      goal: "Launch a new product",
      source: "Three new cold brew flavors with a first-week discount.",
      platforms: [Platform.FACEBOOK, Platform.GOOGLE_BUSINESS, Platform.LINKEDIN]
    });

    expect(drafts).toHaveLength(3);
    expect(drafts.map((draft) => draft.platform)).toEqual([
      Platform.FACEBOOK,
      Platform.GOOGLE_BUSINESS,
      Platform.LINKEDIN
    ]);
    expect(drafts[0].caption).toContain("Luna Brew Cafe");
    expect(drafts[1].mediaType).toBe(MediaType.IMAGE);
    expect(drafts[2].caption).toContain("busy professionals");
  });
});
