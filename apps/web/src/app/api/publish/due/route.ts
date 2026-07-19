import { NextResponse } from "next/server";
import { publishDueJobs } from "@/lib/publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const results = await publishDueJobs();
  return NextResponse.json({
    ok: true,
    processed: results.length,
    results
  });
}
