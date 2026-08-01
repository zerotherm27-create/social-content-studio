import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildManualExport } from "@/lib/export";

export async function GET() {
  const brand = await db.brand.findFirst({
    include: { drafts: { select: exportDraftSelect } }
  });

  if (!brand) {
    return NextResponse.json({ error: "No brand found" }, { status: 404 });
  }

  return NextResponse.json(buildManualExport({ brandName: brand.name, drafts: brand.drafts }));
}

const exportDraftSelect = {
  platform: true,
  caption: true,
  mediaType: true,
  hashtags: true,
  riskLevel: true,
  approvalStatus: true,
  scheduledAt: true
} as const;
