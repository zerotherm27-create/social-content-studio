import { NextResponse } from "next/server";
import { generateDrafts } from "@/lib/agent/mock-agent";
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
  const generatedDrafts = generateDrafts({
    brandName: campaign.brand.name,
    voice: campaign.brand.voice,
    audience: campaign.brand.audience,
    campaignTitle: campaign.title,
    goal: campaign.goal,
    source: campaign.source,
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
        riskLevel: policy.riskLevel,
        approvalStatus: policy.status
      }
    });
    createdDrafts.push(created);
  }

  await db.campaign.update({
    where: { id: campaign.id },
    data: { status: CampaignStatus.GENERATED }
  });

  return NextResponse.json({ drafts: createdDrafts });
}
