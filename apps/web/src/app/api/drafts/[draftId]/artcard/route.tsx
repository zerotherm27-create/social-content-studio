import { loadDraftArtCardAsset } from "@/lib/draft-art-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const result = await loadDraftArtCardAsset(draftId);

  if (!result) return new Response("Draft not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  if (result.kind === "image") {
    return new Response(new Uint8Array(result.body), {
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60"
      }
    });
  }

  return new Response(
    result.svg,
    {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}
