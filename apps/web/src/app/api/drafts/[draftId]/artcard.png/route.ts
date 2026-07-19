import sharp from "sharp";
import { loadDraftArtCardSvg } from "@/lib/draft-art-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const result = await loadDraftArtCardSvg(draftId);

  if (!result) {
    return new Response("Draft not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const png = await sharp(Buffer.from(result.svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": result.generatedPhoto
        ? "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60"
        : "no-store"
    }
  });
}
