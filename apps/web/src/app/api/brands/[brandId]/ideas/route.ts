import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateContentIdeas } from "@/lib/agent/idea-agent";

export async function GET(_request: Request, context: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await context.params;
  const ideas = await db.contentIdea.findMany({ where: { brandId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ideas });
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
      ...generated.map((idea) => db.contentIdea.create({ data: { brandId, ...idea } }))
    ]);
    const ideas = await db.contentIdea.findMany({ where: { brandId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ ideas }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Idea generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
