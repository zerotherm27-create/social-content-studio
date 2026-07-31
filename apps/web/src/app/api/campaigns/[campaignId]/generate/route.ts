import { NextResponse } from "next/server";
import { generateAgentDrafts } from "@/lib/agent/ai-agent";
import { db } from "@/lib/db";
import { CampaignStatus, type ApprovalMode as ApprovalModeValue, type Platform as PlatformValue } from "@/lib/domain";
import { decideApprovalStatus } from "@/lib/policy";

export async function POST(_request: Request, context: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await context.params;
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: {
        include: { approvalRules: true }
      }
    }
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const platforms = JSON.parse(campaign.targetPlatforms) as PlatformValue[];
  const generatedDrafts = await generateAgentDrafts({
    brandName: campaign.brand.name,
    voice: campaign.brand.voice,
    audience: campaign.brand.audience,
    campaignTitle: campaign.title,
    goal: campaign.goal,
    source: campaign.source,
    offers: campaign.brand.offers,
    visualStyle: campaign.brand.visualStyle,
    bannedPhrases: campaign.brand.bannedPhrases,
    tone: campaign.tone,
    creativeDirection: campaign.creativeDirection,
    platforms
  });

  await db.contentDraft.deleteMany({ where: { campaignId: campaign.id } });

  const createdDrafts = [];
  for (const draft of generatedDrafts) {
    const policy = decideApprovalStatus({
      approvalMode: campaign.brand.approvalMode as ApprovalModeValue,
      platform: draft.platform,
      caption: draft.caption,
      ruleTriggers: campaign.brand.approvalRules.map((rule) => rule.trigger)
    });

    const created = await db.contentDraft.create({
      data: {
        brandId: campaign.brandId,
        campaignId: campaign.id,
        platform: draft.platform,
        caption: draft.caption,
        mediaType: draft.mediaType,
        hashtags: JSON.stringify(draft.hashtags),
        artHeadline: draft.artHeadline,
        artSubline: draft.artSubline,
        visualDirection: draft.visualDirection,
        riskLevel: policy.riskLevel,
        approvalStatus: policy.status
      },
      select: contentDraftSelect
    });
    createdDrafts.push(withMissingArtCardFields(created));
  }

  await db.campaign.update({
    where: { id: campaign.id },
    data: { status: CampaignStatus.GENERATED }
  });

  return NextResponse.json({ drafts: createdDrafts });
}

const contentDraftSelect = {
  id: true,
  brandId: true,
  campaignId: true,
  platform: true,
  caption: true,
  mediaType: true,
  hashtags: true,
  artHeadline: true,
  artSubline: true,
  visualDirection: true,
  riskLevel: true,
  approvalStatus: true,
  scheduledAt: true,
  createdAt: true,
  updatedAt: true
} as const;

function withMissingArtCardFields<T extends object>(record: T) {
  return {
    ...record,
    artCardImageBase64: null,
    artCardImageMimeType: null,
    artCardPrompt: null,
    artCardGeneratedAt: null
  };
}
