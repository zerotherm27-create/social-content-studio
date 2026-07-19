import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const updateBrandSchema = z.object({
  websiteUrl: z.string().url().or(z.literal("")),
  voice: z.string().min(3),
  audience: z.string().min(3),
  offers: z.string().min(3),
  visualStyle: z.string().min(3),
  bannedPhrases: z.string()
});

export async function PATCH(request: Request, context: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await context.params;
  const payload = updateBrandSchema.parse(await request.json());
  const brand = await db.brand.update({
    where: { id: brandId },
    data: { ...payload, websiteUrl: payload.websiteUrl || null }
  });
  return NextResponse.json({ brand });
}

export async function DELETE(_request: Request, context: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await context.params;
  const brandCount = await db.brand.count();

  if (brandCount <= 1) {
    return NextResponse.json({ error: "You need at least one brand in the workspace." }, { status: 400 });
  }

  const brand = await db.brand.findUnique({
    where: { id: brandId },
    select: { id: true, name: true }
  });

  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 });
  }

  await db.brand.delete({ where: { id: brandId } });

  const nextBrand = await db.brand.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  return NextResponse.json({ deletedBrand: brand, nextBrandId: nextBrand?.id ?? null });
}
