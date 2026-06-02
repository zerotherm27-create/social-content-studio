import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Platform } from "@/lib/domain";
import { exchangeGoogleBusinessCode } from "@/lib/integrations/google-business";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const brandId = requestUrl.searchParams.get("state");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!code || !brandId) {
    return NextResponse.json({ error: "Missing Google OAuth callback parameters." }, { status: 400 });
  }

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 400 });
  }

  const tokens = await exchangeGoogleBusinessCode({
    code,
    clientId,
    clientSecret,
    redirectUri
  });

  const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
  await db.socialAccount.updateMany({
    where: {
      brandId,
      platform: Platform.GOOGLE_BUSINESS
    },
    data: {
      connected: true,
      tokenStatus: "connected",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt
    }
  });

  return NextResponse.redirect(new URL("/", request.url));
}
