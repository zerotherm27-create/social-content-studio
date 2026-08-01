import { describe, expect, it } from "vitest";
import { Platform } from "@/lib/domain";
import {
  buildSocialIntelligenceBrief,
  buildStrategicVisualDirection,
  getPlatformPlaybook,
  inferCampaignAngle,
  inferFunnelStage
} from "@/lib/agent/social-intelligence";

const input = {
  brandName: "The Laundry Project",
  audience: "busy condo residents",
  offers: "Laundry pickup, wash, fold, dry clean, and delivery",
  campaignTitle: "Book laundry pickup",
  goal: "Drive Messenger bookings",
  source: "Customers can book pickup through Messenger.",
  visualStyle: "White canvas, teal headline, yellow CTA, realistic folded laundry"
};

describe("social intelligence", () => {
  it("infers campaign angle and funnel stage from the brief", () => {
    const angle = inferCampaignAngle(input);

    expect(angle).toBe("booking");
    expect(inferFunnelStage(input, angle)).toBe("conversion");
  });

  it("builds a reusable strategic brief with platform playbooks and quality gates", () => {
    const brief = buildSocialIntelligenceBrief({
      ...input,
      platforms: [Platform.INSTAGRAM, Platform.GOOGLE_BUSINESS]
    });

    expect(brief.agentMode).toContain("social media strategist");
    expect(brief.campaignStrategy.conversionAction).toBe("book or schedule");
    expect(brief.platformPlaybooks.INSTAGRAM.role).toContain("visual");
    expect(brief.platformPlaybooks.GOOGLE_BUSINESS.role).toContain("local search");
    expect(brief.qualityGate).toContain("Would a real social media manager post this for the brand?");
    expect(brief.antiPatterns).toContain("template pull-out");
  });

  it("returns platform-specific creative guidance", () => {
    const instagram = getPlatformPlaybook(Platform.INSTAGRAM, "booking", "conversion");
    const threads = getPlatformPlaybook(Platform.THREADS, "booking", "conversion");

    expect(instagram.creativeMandate).toContain("strong cover image");
    expect(threads.captionStyle).toContain("conversational");
  });

  it("builds a premium art-card direction without template language", () => {
    const direction = buildStrategicVisualDirection({
      ...input,
      platform: Platform.INSTAGRAM
    });

    expect(direction).toContain("Campaign angle: booking");
    expect(direction).toContain("finished social art-card concept");
    expect(direction).toContain("do not create a generic template");
    expect(direction).toContain("safe space");
  });
});
