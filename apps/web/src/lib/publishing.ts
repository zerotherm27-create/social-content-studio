import { db } from "./db";
import { ApprovalStatus, Platform, PublishStatus } from "./domain";
import { getPublicAppUrl } from "./app-url";
import { createGoogleBusinessLocalPost } from "./integrations/google-business";
import { createInstagramImagePost, createMetaPagePost } from "./integrations/meta";
import { createThreadsTextPost } from "./integrations/threads";

type PublishResult = {
  platform: string;
  externalId: string;
  raw: unknown;
};

export async function publishDraftImmediately(draftId: string) {
  const job = await db.publishJob.create({
    data: {
      draftId,
      scheduledAt: new Date(),
      status: PublishStatus.QUEUED
    }
  });

  return publishJob(job.id);
}

export async function publishDueJobs(limit = 10) {
  const jobs = await db.publishJob.findMany({
    where: {
      status: PublishStatus.QUEUED,
      scheduledAt: { lte: new Date() },
      draft: {
        approvalStatus: ApprovalStatus.SCHEDULED
      }
    },
    orderBy: { scheduledAt: "asc" },
    take: limit
  });

  const results = [];
  for (const job of jobs) {
    results.push(await publishJob(job.id));
  }

  return results;
}

export async function publishJob(jobId: string) {
  const job = await db.publishJob.findUnique({
    where: { id: jobId },
    include: {
      draft: {
        include: {
          brand: {
            include: { socialAccounts: true }
          }
        }
      }
    }
  });

  if (!job) {
    return { jobId, status: PublishStatus.FAILED, error: "Publish job not found." };
  }

  if (job.status === PublishStatus.SUCCEEDED) {
    return { jobId, status: PublishStatus.SUCCEEDED, skipped: true };
  }

  const runningJob = await db.publishJob.update({
    where: { id: job.id },
    data: {
      status: PublishStatus.RUNNING,
      attempts: { increment: 1 },
      lastError: null
    }
  });

  try {
    const result = await publishDraftToPlatform(job.draft);

    await db.publishLog.create({
      data: {
        publishJobId: job.id,
        status: PublishStatus.SUCCEEDED,
        message: `Published to ${formatPlatform(job.draft.platform)}.`,
        rawResponse: JSON.stringify(result.raw)
      }
    });

    await db.publishJob.update({
      where: { id: job.id },
      data: { status: PublishStatus.SUCCEEDED }
    });

    await db.contentDraft.updateMany({
      where: { id: job.draft.id },
      data: {
        approvalStatus: ApprovalStatus.PUBLISHED,
        scheduledAt: job.scheduledAt
      }
    });

    return { jobId, status: PublishStatus.SUCCEEDED, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown publishing error.";

    await db.publishLog.create({
      data: {
        publishJobId: job.id,
        status: PublishStatus.FAILED,
        message,
        rawResponse: "{}"
      }
    });

    await db.publishJob.update({
      where: { id: job.id },
      data: {
        status: PublishStatus.FAILED,
        attempts: runningJob.attempts,
        lastError: message
      }
    });

    await db.contentDraft.updateMany({
      where: { id: job.draft.id },
      data: { approvalStatus: ApprovalStatus.FAILED }
    });

    return { jobId, status: PublishStatus.FAILED, error: message };
  }
}

async function publishDraftToPlatform(draft: Awaited<ReturnType<typeof loadDraftForPublishing>>) {
  if (!draft) throw new Error("Draft not found.");

  if (draft.platform === Platform.GOOGLE_BUSINESS) {
    const account = draft.brand.socialAccounts.find((item) => item.platform === Platform.GOOGLE_BUSINESS);
    if (!account?.connected || !account.accessToken || !account.locationName) {
      throw new Error("Google Business Profile is not connected.");
    }

    const result = await createGoogleBusinessLocalPost({
      accessToken: account.accessToken,
      locationName: account.locationName,
      draft
    });

    return {
      platform: Platform.GOOGLE_BUSINESS,
      externalId: result.name,
      raw: result
    } satisfies PublishResult;
  }

  if (draft.platform === Platform.FACEBOOK) {
    const account = draft.brand.socialAccounts.find((item) => item.platform === Platform.FACEBOOK);
    if (!account?.connected || !account.accessToken || !account.externalId) {
      throw new Error("Facebook Page is not connected.");
    }

    const result = await createMetaPagePost({
      pageId: account.externalId,
      pageAccessToken: account.accessToken,
      message: withHashtags(draft.caption, draft.hashtags),
      link: draft.brand.websiteUrl ?? undefined
    });

    return {
      platform: Platform.FACEBOOK,
      externalId: result.post_id ?? result.id,
      raw: result
    } satisfies PublishResult;
  }

  if (draft.platform === Platform.INSTAGRAM) {
    const account = draft.brand.socialAccounts.find((item) => item.platform === Platform.INSTAGRAM);
    if (!account?.connected || !account.accessToken || !account.externalId) {
      throw new Error("Instagram Business account is not connected.");
    }

    const result = await createInstagramImagePost({
      igUserId: account.externalId,
      pageAccessToken: account.accessToken,
      imageUrl: `${getPublicAppUrl()}/api/drafts/${draft.id}/artcard.png`,
      caption: withHashtags(draft.caption, draft.hashtags)
    });

    return {
      platform: Platform.INSTAGRAM,
      externalId: result.id,
      raw: result
    } satisfies PublishResult;
  }

  if (draft.platform === Platform.THREADS) {
    const account = draft.brand.socialAccounts.find((item) => item.platform === Platform.THREADS);
    if (!account?.connected || !account.accessToken || !account.externalId) {
      throw new Error("Threads account is not connected.");
    }

    const result = await createThreadsTextPost({
      userId: account.externalId,
      accessToken: account.accessToken,
      text: withHashtags(draft.caption, draft.hashtags)
    });

    return {
      platform: Platform.THREADS,
      externalId: result.id,
      raw: result
    } satisfies PublishResult;
  }

  throw new Error(`${formatPlatform(draft.platform)} publishing is not configured yet.`);
}

function loadDraftForPublishing(draftId: string) {
  return db.contentDraft.findUnique({
    where: { id: draftId },
    select: {
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
      updatedAt: true,
      brand: {
        include: { socialAccounts: true }
      }
    }
  });
}

function withHashtags(caption: string, hashtags: string) {
  const parsed = parseHashtags(hashtags);
  return [caption.trim(), parsed.join(" ")].filter(Boolean).join("\n\n");
}

function parseHashtags(value: string) {
  try {
    const parsed = JSON.parse(value) as string[];
    return parsed.filter((tag) => tag.startsWith("#"));
  } catch {
    return [];
  }
}

function formatPlatform(platform: string) {
  return platform.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
