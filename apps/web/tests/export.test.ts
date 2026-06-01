import { describe, expect, it } from "vitest";
import { ApprovalStatus, MediaType, Platform, RiskLevel } from "@/lib/domain";
import { buildManualExport } from "@/lib/export";

describe("buildManualExport", () => {
  it("formats drafts into a portable publishing plan", () => {
    const exported = buildManualExport({
      brandName: "Luna Brew Cafe",
      drafts: [
        {
          platform: Platform.FACEBOOK,
          caption: "Visit Luna Brew Cafe this weekend.",
          mediaType: MediaType.IMAGE,
          hashtags: JSON.stringify(["#luna", "#coffee"]),
          riskLevel: RiskLevel.LOW,
          approvalStatus: ApprovalStatus.APPROVED,
          scheduledAt: new Date("2026-06-03T01:30:00.000Z")
        }
      ]
    });

    expect(exported.brandName).toBe("Luna Brew Cafe");
    expect(exported.posts[0]).toEqual({
      platform: "FACEBOOK",
      caption: "Visit Luna Brew Cafe this weekend.",
      mediaType: "IMAGE",
      hashtags: ["#luna", "#coffee"],
      riskLevel: "LOW",
      approvalStatus: "APPROVED",
      scheduledAt: "2026-06-03T01:30:00.000Z"
    });
  });
});
