import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { extractBrandProfile } from "@/lib/agent/brand-profile-agent";
import { readPublicWebsite } from "@/lib/safe-website";

const extractSchema = z.object({ websiteUrl: z.string().url() });

export async function POST(request: Request, context: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await context.params;
  const { websiteUrl } = extractSchema.parse(await request.json());
  const brand = await db.brand.findUnique({ where: { id: brandId } });
  if (!brand) return NextResponse.json({ error: "Brand not found." }, { status: 404 });

  try {
    const evidence = await readPublicWebsite(websiteUrl);
    const profile = await extractBrandProfile({ brandName: brand.name, websiteUrl, ...evidence });
    const updatedBrand = await db.brand.update({
      where: { id: brandId },
      data: {
        ...profile,
        websiteUrl
      }
    });

    return NextResponse.json({
      profile,
      brand: updatedBrand,
      evidence: { pageTitle: evidence.pageTitle, description: evidence.description }
    });
  } catch (error) {
    console.error("Brand website extraction failed", {
      brandId,
      websiteHost: new URL(websiteUrl).hostname,
      error
    });
    const message = error instanceof Error ? error.message : "Could not learn from this website.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
