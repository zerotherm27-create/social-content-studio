import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApprovalStatus, Platform, PublishStatus } from "@/lib/domain";
import { nextBestDailyPublishAt } from "@/lib/scheduling";

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  mode: z.enum(["BEST_DAILY"]).optional()
}).refine((payload) => payload.scheduledAt || payload.mode === "BEST_DAILY", {
  message: "Provide a scheduledAt time or choose BEST_DAILY mode."
});

export async function POST(request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const payload = scheduleSchema.parse(await request.json());
  const existingDraft = await db.contentDraft.findUnique({
    where: { id: draftId },
    select: { brandId: true, platform: true }
  });

  if (!existingDraft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  if (!canAutoPublish(existingDraft.platform)) {
    return NextResponse.json(
      { error: `${existingDraft.platform.replaceAll("_", " ")} publishing is not configured yet.` },
      { status: 400 }
    );
  }

  const scheduledAt = payload.scheduledAt
    ? new Date(payload.scheduledAt)
    : nextBestDailyPublishAt({
        platform: existingDraft.platform,
        existingScheduledDates: (
          await db.contentDraft.findMany({
            where: {
              brandId: existingDraft.brandId,
              scheduledAt: { not: null },
              approvalStatus: ApprovalStatus.SCHEDULED
            },
            select: { scheduledAt: true }
          })
        ).flatMap((draft) => draft.scheduledAt ? [draft.scheduledAt] : [])
      });

  const draft = await db.$transaction(async (tx) => {
    const updatedDraft = await tx.contentDraft.update({
      where: { id: draftId },
      data: {
        scheduledAt,
        approvalStatus: ApprovalStatus.SCHEDULED
      },
      select: { id: true }
    });

    const queuedJob = await tx.publishJob.findFirst({
      where: {
        draftId,
        status: PublishStatus.QUEUED
      },
      orderBy: { createdAt: "desc" }
    });

    if (queuedJob) {
      await tx.publishJob.update({
        where: { id: queuedJob.id },
        data: {
          scheduledAt,
          lastError: null
        }
      });
    } else {
      await tx.publishJob.create({
        data: {
          draftId,
          scheduledAt
        }
      });
    }

    return tx.contentDraft.findUniqueOrThrow({
      where: { id: updatedDraft.id },
      select: {
        ...contentDraftSelect,
        publishJobs: true
      }
    });
  });

  return NextResponse.json({ draft: withMissingArtCardFields(draft) });
}

function canAutoPublish(platform: string) {
  return platform === Platform.GOOGLE_BUSINESS || platform === Platform.FACEBOOK || platform === Platform.INSTAGRAM || platform === Platform.THREADS;
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
