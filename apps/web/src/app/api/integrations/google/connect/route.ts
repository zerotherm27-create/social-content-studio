import { NextResponse } from "next/server";
import { buildGoogleBusinessOAuthUrl } from "@/lib/integrations/google-business";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const brandId = requestUrl.searchParams.get("brandId");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!brandId) {
    return NextResponse.json({ error: "Missing brandId." }, { status: 400 });
  }

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 400 });
  }

  const oauthUrl = buildGoogleBusinessOAuthUrl({
    clientId,
    redirectUri,
    state: brandId
  });

  return NextResponse.redirect(oauthUrl);
}
