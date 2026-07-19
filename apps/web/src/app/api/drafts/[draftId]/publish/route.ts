import { NextResponse } from "next/server";
import { publishDraftImmediately } from "@/lib/publishing";

export async function POST(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const result = await publishDraftImmediately(draftId);

  if (result.status === "FAILED") {
    return NextResponse.json({ error: result.error ?? "Publishing failed.", result }, { status: 502 });
  }

  return NextResponse.json({ result });
}
