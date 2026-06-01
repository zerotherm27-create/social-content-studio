import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildManualExport } from "@/lib/export";

export async function GET() {
  const brand = await db.brand.findFirst({
    include: { drafts: true }
  });

  if (!brand) {
    return NextResponse.json({ error: "No brand found" }, { status: 404 });
  }

  return NextResponse.json(buildManualExport({ brandName: brand.name, drafts: brand.drafts }));
}
