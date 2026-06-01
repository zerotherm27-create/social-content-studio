import { MediaType, Platform, type MediaType as MediaTypeValue, type Platform as PlatformValue } from "./domain";

export type PlatformDefinition = {
  platform: PlatformValue;
  label: string;
  shortLabel: string;
  supportedMedia: MediaTypeValue[];
  defaultRequiresReview: boolean;
};

export const platformDefinitions: PlatformDefinition[] = [
  {
    platform: Platform.FACEBOOK,
    label: "Facebook Pages",
    shortLabel: "Facebook",
    supportedMedia: [MediaType.TEXT, MediaType.IMAGE, MediaType.VIDEO],
    defaultRequiresReview: false
  },
  {
    platform: Platform.INSTAGRAM,
    label: "Instagram",
    shortLabel: "Instagram",
    supportedMedia: [MediaType.IMAGE, MediaType.VIDEO],
    defaultRequiresReview: false
  },
  {
    platform: Platform.GOOGLE_BUSINESS,
    label: "Google Business Profile",
    shortLabel: "Google",
    supportedMedia: [MediaType.TEXT, MediaType.IMAGE],
    defaultRequiresReview: false
  },
  {
    platform: Platform.TIKTOK,
    label: "TikTok",
    shortLabel: "TikTok",
    supportedMedia: [MediaType.VIDEO],
    defaultRequiresReview: true
  },
  {
    platform: Platform.LINKEDIN,
    label: "LinkedIn",
    shortLabel: "LinkedIn",
    supportedMedia: [MediaType.TEXT, MediaType.IMAGE, MediaType.VIDEO],
    defaultRequiresReview: true
  }
];

export function getPlatformDefinition(platform: PlatformValue) {
  const definition = platformDefinitions.find((item) => item.platform === platform);
  if (!definition) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return definition;
}
