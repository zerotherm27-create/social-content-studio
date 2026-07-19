import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApprovalMode, Platform } from "@/lib/domain";

const createBrandSchema = z.object({
  name: z.string().min(2),
  websiteUrl: z.string().url().or(z.literal("")).optional()
});

const defaultApprovalRules = [
  { name: "Price claims", trigger: "price|discount|free|guarantee", requiresReview: true },
  { name: "Regulated claims", trigger: "health|legal|medical|financial|political", requiresReview: true },
  { name: "Competitors", trigger: "better than|versus|competitor", requiresReview: true }
];

export async function POST(request: Request) {
  const payload = createBrandSchema.parse(await request.json());
  const workspace =
    (await db.workspace.findFirst({ orderBy: { createdAt: "asc" } })) ??
    (await db.workspace.create({ data: { name: "Social Content Workspace" } }));

  const brand = await db.brand.create({
    data: {
      workspaceId: workspace.id,
      name: payload.name.trim(),
      initials: buildInitials(payload.name),
      voice: "",
      audience: "",
      offers: "",
      bannedPhrases: "",
      websiteUrl: payload.websiteUrl || null,
      visualStyle: "",
      approvalMode: ApprovalMode.HYBRID,
      socialAccounts: {
        create: [
          { platform: Platform.FACEBOOK, displayName: `${payload.name} Facebook`, externalId: `pending-${crypto.randomUUID()}`, connected: false },
          { platform: Platform.INSTAGRAM, displayName: `${payload.name} Instagram`, externalId: `pending-${crypto.randomUUID()}`, connected: false },
          { platform: Platform.THREADS, displayName: `${payload.name} Threads`, externalId: `pending-${crypto.randomUUID()}`, connected: false },
          { platform: Platform.GOOGLE_BUSINESS, displayName: `${payload.name} Google Business`, externalId: `pending-${crypto.randomUUID()}`, connected: false },
          { platform: Platform.TIKTOK, displayName: `${payload.name} TikTok`, externalId: `pending-${crypto.randomUUID()}`, connected: false },
          { platform: Platform.LINKEDIN, displayName: `${payload.name} LinkedIn`, externalId: `pending-${crypto.randomUUID()}`, connected: false }
        ]
      },
      approvalRules: {
        create: defaultApprovalRules
      }
    }
  });

  return NextResponse.json({ brand }, { status: 201 });
}

function buildInitials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return letters || "BR";
}
