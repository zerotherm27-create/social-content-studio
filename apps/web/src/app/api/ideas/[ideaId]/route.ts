import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const updateIdeaSchema = z.object({ status: z.enum(["PROPOSED", "SAVED", "SKIPPED", "BUILT"]) });

export async function PATCH(request: Request, context: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await context.params;
  const payload = updateIdeaSchema.parse(await request.json());
  const idea = await db.contentIdea.update({ where: { id: ideaId }, data: payload });
  return NextResponse.json({ idea });
}
