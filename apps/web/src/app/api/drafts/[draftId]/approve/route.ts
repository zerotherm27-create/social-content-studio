import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApprovalStatus } from "@/lib/domain";

export async function POST(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const draft = await db.contentDraft.update({
    where: { id: draftId },
    data: { approvalStatus: ApprovalStatus.APPROVED }
  });

  return NextResponse.json({ draft });
}
