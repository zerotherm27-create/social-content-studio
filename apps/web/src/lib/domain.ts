export const ApprovalMode = {
  REVIEW: "REVIEW",
  HYBRID: "HYBRID",
  AUTOPILOT: "AUTOPILOT"
} as const;

export type ApprovalMode = (typeof ApprovalMode)[keyof typeof ApprovalMode];

export const CampaignStatus = {
  DRAFT: "DRAFT",
  GENERATED: "GENERATED",
  SCHEDULED: "SCHEDULED",
  ARCHIVED: "ARCHIVED"
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const Platform = {
  FACEBOOK: "FACEBOOK",
  INSTAGRAM: "INSTAGRAM",
  THREADS: "THREADS",
  GOOGLE_BUSINESS: "GOOGLE_BUSINESS",
  TIKTOK: "TIKTOK",
  LINKEDIN: "LINKEDIN"
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

export const MediaType = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO"
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const RiskLevel = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const ApprovalStatus = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  AUTOPILOT_READY: "AUTOPILOT_READY",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED"
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const PublishStatus = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED"
} as const;

export type PublishStatus = (typeof PublishStatus)[keyof typeof PublishStatus];
