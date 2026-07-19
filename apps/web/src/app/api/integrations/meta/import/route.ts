import { NextResponse } from "next/server";
import { z } from "zod";
import { extractBrandProfile } from "@/lib/agent/brand-profile-agent";
import { db } from "@/lib/db";
import { Platform } from "@/lib/domain";
import { fetchMetaPagePosts, summarizeMetaPosts } from "@/lib/integrations/meta";

const importSchema = z.object({
  brandId: z.string().min(1)
});

export async function POST(request: Request) {
  const payload = await readJson(request);
  const parsed = importSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing brand ID." }, { status: 400 });
  }

  const { brandId } = parsed.data;
  const brand = await db.brand.findUnique({
    where: { id: brandId },
    include: { socialAccounts: true }
  });

  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 });
  }

  const facebookAccount = brand.socialAccounts.find((account) => account.platform === Platform.FACEBOOK);
  if (!facebookAccount?.connected || !facebookAccount.accessToken || !facebookAccount.externalId) {
    return NextResponse.json({ error: "Facebook Page is not connected for this brand." }, { status: 400 });
  }

  try {
    const posts = await fetchMetaPagePosts({
      pageId: facebookAccount.externalId,
      pageAccessToken: facebookAccount.accessToken,
      limit: 20
    });
    const pageText = summarizeMetaPosts(posts);

    if (!pageText) {
      return NextResponse.json({ error: "No readable Facebook Page post text was found." }, { status: 400 });
    }

    const profile = await extractBrandProfile({
      brandName: brand.name,
      websiteUrl: brand.websiteUrl ?? `https://facebook.com/${facebookAccount.externalId}`,
      pageTitle: facebookAccount.displayName,
      description: `Recent Facebook Page posts from ${facebookAccount.displayName}.`,
      pageText
    });
    const updatedBrand = await db.brand.update({
      where: { id: brandId },
      data: profile
    });

    return NextResponse.json({
      profile,
      brand: updatedBrand,
      evidence: {
        pageName: facebookAccount.displayName,
        postsReviewed: posts.length
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not learn from Facebook.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
