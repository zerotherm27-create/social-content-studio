import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateContentIdeas } from "@/lib/agent/idea-agent";

export async function GET(_request: Request, context: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await context.params;
  const ideas = await db.contentIdea.findMany({ where: { brandId }, orderBy: { createdAt: "desc" }, select: contentIdeaSelect });
  return NextResponse.json({ ideas: ideas.map(withMissingArtCardFields) });
}

export async function POST(_request: Request, context: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await context.params;
  const brand = await db.brand.findUnique({ where: { id: brandId } });
  if (!brand) return NextResponse.json({ error: "Brand not found." }, { status: 404 });

  try {
    const generated = await generateContentIdeas({
      brandName: brand.name,
      voice: brand.voice,
      audience: brand.audience,
      offers: brand.offers,
      visualStyle: brand.visualStyle
    });
    await db.$transaction([
      db.contentIdea.deleteMany({ where: { brandId, status: { in: ["PROPOSED", "SKIPPED"] } } }),
      ...generated.map((idea) => db.contentIdea.create({ data: { brandId, ...idea }, select: { id: true } }))
    ]);
    const ideas = await db.contentIdea.findMany({ where: { brandId }, orderBy: { createdAt: "desc" }, select: contentIdeaSelect });
    return NextResponse.json({ ideas: ideas.map(withMissingArtCardFields) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Idea generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
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
