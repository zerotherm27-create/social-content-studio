import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const updateIdeaSchema = z.object({ status: z.enum(["PROPOSED", "SAVED", "SKIPPED", "BUILT"]) });

export async function PATCH(request: Request, context: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await context.params;
  const payload = updateIdeaSchema.parse(await request.json());
  const idea = await db.contentIdea.update({ where: { id: ideaId }, data: payload, select: contentIdeaSelect });
  return NextResponse.json({ idea: withMissingArtCardFields(idea) });
}

const contentIdeaSelect = {
  id: true,
  brandId: true,
  platform: true,
  title: true,
  hook: true,
  purpose: true,
  format: true,
  goal: true,
  artCardText: true,
  caption: true,
  cta: true,
  seoKeywords: true,
  reason: true,
  imagePrompt: true,
  status: true,
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
