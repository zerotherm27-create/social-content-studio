import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApprovalStatus, Platform, PublishStatus } from "@/lib/domain";
import { createGoogleBusinessLocalPost } from "@/lib/integrations/google-business";

export async function POST(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const draft = await db.contentDraft.findUnique({
    where: { id: draftId },
    include: {
      brand: {
        include: { socialAccounts: true }
      }
    }
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  if (draft.platform !== Platform.GOOGLE_BUSINESS) {
    return NextResponse.json({ error: "Draft is not for Google Business Profile." }, { status: 400 });
  }

  const googleAccount = draft.brand.socialAccounts.find((account) => account.platform === Platform.GOOGLE_BUSINESS);
  if (!googleAccount?.connected || !googleAccount.accessToken || !googleAccount.locationName) {
    return NextResponse.json({ error: "Google Business Profile is not connected." }, { status: 400 });
  }

  const publishJob = await db.publishJob.create({
    data: {
      draftId: draft.id,
      scheduledAt: new Date(),
      status: PublishStatus.RUNNING
    }
  });

  try {
    const result = await createGoogleBusinessLocalPost({
      accessToken: googleAccount.accessToken,
      locationName: googleAccount.locationName,
      draft
    });

    await db.publishLog.create({
      data: {
        publishJobId: publishJob.id,
        status: PublishStatus.SUCCEEDED,
        message: "Published to Google Business Profile.",
        rawResponse: JSON.stringify(result)
      }
    });

    await db.publishJob.update({
      where: { id: publishJob.id },
      data: { status: PublishStatus.SUCCEEDED, attempts: 1 }
    });

    const updatedDraft = await db.contentDraft.update({
      where: { id: draft.id },
      data: { approvalStatus: ApprovalStatus.PUBLISHED }
    });

    return NextResponse.json({ draft: updatedDraft, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Google publishing error.";
    await db.publishLog.create({
      data: {
        publishJobId: publishJob.id,
        status: PublishStatus.FAILED,
        message,
        rawResponse: "{}"
      }
    });
    await db.publishJob.update({
      where: { id: publishJob.id },
      data: { status: PublishStatus.FAILED, attempts: 1, lastError: message }
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
