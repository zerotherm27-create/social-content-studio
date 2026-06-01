import { describe, expect, it } from "vitest";
import { ApprovalMode, Platform } from "@/lib/domain";
import { decideApprovalStatus } from "@/lib/policy";

describe("decideApprovalStatus", () => {
  it("requires review when the brand is review-only", () => {
    const decision = decideApprovalStatus({
      approvalMode: ApprovalMode.REVIEW,
      platform: Platform.GOOGLE_BUSINESS,
      caption: "Visit us today for a seasonal latte.",
      ruleTriggers: []
    });

    expect(decision.status).toBe("PENDING_REVIEW");
    expect(decision.riskLevel).toBe("MEDIUM");
    expect(decision.reasons).toContain("Brand is configured for review mode.");
  });

  it("allows low-risk Google Business updates in hybrid mode", () => {
    const decision = decideApprovalStatus({
      approvalMode: ApprovalMode.HYBRID,
      platform: Platform.GOOGLE_BUSINESS,
      caption: "New cold brew flight is available this weekend.",
      ruleTriggers: ["price|discount|free|guarantee"]
    });

    expect(decision.status).toBe("AUTOPILOT_READY");
    expect(decision.riskLevel).toBe("LOW");
  });

  it("requires review when a trigger matches sensitive text", () => {
    const decision = decideApprovalStatus({
      approvalMode: ApprovalMode.HYBRID,
      platform: Platform.FACEBOOK,
      caption: "Get a guaranteed discount this week.",
      ruleTriggers: ["price|discount|free|guarantee"]
    });

    expect(decision.status).toBe("PENDING_REVIEW");
    expect(decision.riskLevel).toBe("HIGH");
    expect(decision.reasons).toContain("Matched approval trigger: price|discount|free|guarantee");
  });

  it("requires review for TikTok by default in hybrid mode", () => {
    const decision = decideApprovalStatus({
      approvalMode: ApprovalMode.HYBRID,
      platform: Platform.TIKTOK,
      caption: "A quick behind-the-scenes cafe video.",
      ruleTriggers: []
    });

    expect(decision.status).toBe("PENDING_REVIEW");
    expect(decision.riskLevel).toBe("MEDIUM");
    expect(decision.reasons).toContain("Platform defaults to review before publishing.");
  });
});
