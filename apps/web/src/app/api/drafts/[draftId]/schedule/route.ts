import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApprovalStatus } from "@/lib/domain";

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime()
});

export async function POST(request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const payload = scheduleSchema.parse(await request.json());
  const scheduledAt = new Date(payload.scheduledAt);

  const draft = await db.contentDraft.update({
    where: { id: draftId },
    data: {
      scheduledAt,
      approvalStatus: ApprovalStatus.SCHEDULED,
      publishJobs: {
        create: {
          scheduledAt
        }
      }
    },
    include: { publishJobs: true }
  });

  return NextResponse.json({ draft });
}
