import { loadIdeaArtCardAsset } from "@/lib/draft-art-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request, context: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await context.params;
  const platform = new URL(request.url).searchParams.get("platform") ?? undefined;
  const result = await loadIdeaArtCardAsset(ideaId, platform).catch((error) => {
    console.error("Idea art-card image generation failed", {
      ideaId,
      message: error instanceof Error ? error.message : String(error)
    });
    return "generation_failed" as const;
  });

  if (!result) return new Response("Idea not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (result === "generation_failed") {
    return Response.json(
      {
        error: "Real image generation failed. Try again in a few moments if the image model is rate-limited."
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" }
      }
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
