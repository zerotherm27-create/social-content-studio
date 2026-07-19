import { loadDraftArtCardSvg } from "@/lib/draft-art-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const result = await loadDraftArtCardSvg(draftId);

  if (!result) return new Response("Draft not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  return new Response(
    result.svg,
    {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": result.generatedPhoto
          ? "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60"
          : "no-store"
      }
    }
  );
}
