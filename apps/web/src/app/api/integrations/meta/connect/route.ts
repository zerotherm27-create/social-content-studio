import { NextResponse } from "next/server";
import { buildMetaOAuthUrl, getMetaRedirectUri, META_PAGE_CONNECT_SCOPES } from "@/lib/integrations/meta";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const brandId = requestUrl.searchParams.get("brandId");
  const appId = process.env.META_APP_ID?.trim();
  const redirectUri = getMetaRedirectUri(request);

  if (!brandId) {
    return NextResponse.json({ error: "Missing brandId." }, { status: 400 });
  }

  if (!appId) {
    return NextResponse.json({ error: "Meta OAuth is not configured." }, { status: 400 });
  }

  return NextResponse.redirect(
    buildMetaOAuthUrl({
      appId,
      redirectUri,
      scopes: META_PAGE_CONNECT_SCOPES,
      state: brandId
    })
  );
}
