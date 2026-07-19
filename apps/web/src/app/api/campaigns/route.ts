import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { Platform, type Platform as PlatformValue } from "@/lib/domain";

const platformValues = Object.values(Platform) as [PlatformValue, ...PlatformValue[]];

const createCampaignSchema = z.object({
  brandId: z.string().min(1),
  title: z.string().min(2),
  goal: z.string().min(2),
  source: z.string().min(2),
  tone: z.string().max(80).optional().default(""),
  creativeDirection: z.string().max(1000).optional().default(""),
  platforms: z.array(z.enum(platformValues)).min(1)
});

export async function GET() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { brand: true, drafts: true }
  });

  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const payload = createCampaignSchema.parse(await request.json());

  const campaign = await db.campaign.create({
    data: {
      brandId: payload.brandId,
      title: payload.title,
      goal: payload.goal,
      source: payload.source,
      tone: payload.tone,
      creativeDirection: payload.creativeDirection,
      targetPlatforms: JSON.stringify(payload.platforms)
    }
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
