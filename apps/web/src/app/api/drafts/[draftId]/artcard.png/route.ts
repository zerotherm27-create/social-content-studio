import sharp from "sharp";
import { loadDraftArtCardAsset } from "@/lib/draft-art-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const result = await loadDraftArtCardAsset(draftId).catch((error) => {
    console.error("Draft PNG art-card route failed", {
      draftId,
      message: error instanceof Error ? error.message : String(error)
    });
    return "generation_failed" as const;
  });

  if (!result) {
    return new Response("Draft not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  if (result === "generation_failed") {
    return Response.json(
      { error: "Real image generation failed. Draft art-card PNG downloads require a generated raster image." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  const png = await sharp(result.body).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60"
    }
  });
}
