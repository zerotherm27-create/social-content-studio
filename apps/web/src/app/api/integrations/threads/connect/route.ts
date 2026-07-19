import { NextResponse } from "next/server";
import { buildThreadsOAuthUrl, getThreadsAppId, getThreadsRedirectUri } from "@/lib/integrations/threads";

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const brandId = requestUrl.searchParams.get("brandId");
  const appId = getThreadsAppId();
  const redirectUri = getThreadsRedirectUri(request);

  if (!brandId) {
    return NextResponse.json({ error: "Missing brandId." }, { status: 400 });
  }

  if (!appId) {
    return NextResponse.json({ error: "Threads OAuth is not configured." }, { status: 400 });
  }

  return NextResponse.redirect(
    buildThreadsOAuthUrl({
      appId,
      redirectUri,
      state: brandId
    })
  );
}
