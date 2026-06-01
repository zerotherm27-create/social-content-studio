import {
  ApprovalMode,
  ApprovalStatus,
  RiskLevel,
  type ApprovalMode as ApprovalModeValue,
  type ApprovalStatus as ApprovalStatusValue,
  type Platform as PlatformValue,
  type RiskLevel as RiskLevelValue
} from "./domain";
import { getPlatformDefinition } from "./platforms";

type PolicyInput = {
  approvalMode: ApprovalModeValue;
  platform: PlatformValue;
  caption: string;
  ruleTriggers: string[];
};

type PolicyDecision = {
  status: ApprovalStatusValue;
  riskLevel: RiskLevelValue;
  reasons: string[];
};

export function decideApprovalStatus(input: PolicyInput): PolicyDecision {
  if (input.approvalMode === ApprovalMode.REVIEW) {
    return {
      status: ApprovalStatus.PENDING_REVIEW,
      riskLevel: RiskLevel.MEDIUM,
      reasons: ["Brand is configured for review mode."]
    };
  }

  const matchedTrigger = input.ruleTriggers.find((trigger) => {
    const pattern = new RegExp(trigger, "i");
    return pattern.test(input.caption);
  });

  if (matchedTrigger) {
    return {
      status: ApprovalStatus.PENDING_REVIEW,
      riskLevel: RiskLevel.HIGH,
      reasons: [`Matched approval trigger: ${matchedTrigger}`]
    };
  }

  const platformDefinition = getPlatformDefinition(input.platform);
  if (input.approvalMode === ApprovalMode.HYBRID && platformDefinition.defaultRequiresReview) {
    return {
      status: ApprovalStatus.PENDING_REVIEW,
      riskLevel: RiskLevel.MEDIUM,
      reasons: ["Platform defaults to review before publishing."]
    };
  }

  return {
    status: ApprovalStatus.AUTOPILOT_READY,
    riskLevel: RiskLevel.LOW,
    reasons: ["No approval triggers matched."]
  };
}
