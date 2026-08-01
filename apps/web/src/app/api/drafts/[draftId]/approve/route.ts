import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApprovalStatus } from "@/lib/domain";

export async function POST(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const draft = await db.contentDraft.update({
    where: { id: draftId },
    data: { approvalStatus: ApprovalStatus.APPROVED },
    select: contentDraftSelect
  });

  return NextResponse.json({ draft: withMissingArtCardFields(draft) });
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
