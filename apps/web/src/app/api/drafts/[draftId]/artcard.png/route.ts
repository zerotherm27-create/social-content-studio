import { loadDraftArtCardAsset } from "@/lib/draft-art-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const platform = new URL(request.url).searchParams.get("platform") ?? undefined;
  const result = await loadDraftArtCardAsset(draftId, platform).catch((error) => {
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

  return new Response(new Uint8Array(result.body), {
    headers: {
      "Content-Type": "image/png",
      "X-Art-Card-Format": result.format.key,
      "Cache-Control": "no-store"
    }
  });
}
