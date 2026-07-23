import { generatePremiumArtCardImage } from "@/lib/agent/art-image-agent";
import { db } from "@/lib/db";
import { dataUrlToBuffer } from "@/lib/draft-art-card";
import { readPublicBrandAssets } from "@/lib/safe-website";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request, context: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await context.params;
  const platform = new URL(request.url).searchParams.get("platform") ?? undefined;
  const idea = await db.contentIdea.findUnique({
    where: { id: ideaId },
    include: { brand: true }
  });

  if (!idea) return new Response("Idea not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const assets = idea.brand.websiteUrl ? await readPublicBrandAssets(idea.brand.websiteUrl).catch(() => undefined) : undefined;
  const websiteHost = assets?.websiteHost ?? (idea.brand.websiteUrl ? new URL(idea.brand.websiteUrl).hostname.replace(/^www\./, "") : undefined);
  const visualDirection = `${idea.imagePrompt} ${idea.brand.visualStyle}`;
  const generatedArtCard = await generatePremiumArtCardImage({
    brandName: idea.brand.name,
    headline: idea.title,
    subline: idea.hook,
    visualDirection,
    platform,
    brandColor: assets?.brandColor,
    accentColor: assets?.accentColor,
    websiteHost,
    audience: idea.brand.audience,
    offerContext: idea.brand.offers
  }).catch((error) => {
    console.error("Idea art-card image generation failed", {
      ideaId,
      message: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  });

  const decodedImage = generatedArtCard ? dataUrlToBuffer(generatedArtCard) : undefined;
  if (decodedImage) {
    return new Response(new Uint8Array(decodedImage.body), {
      headers: {
        "Content-Type": decodedImage.contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60"
      }
    });
  }

  return Response.json(
    {
      error: "Real image generation failed. Idea art cards require a generated raster image."
    },
    {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    }
  );
}
