import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Platform } from "@/lib/domain";
import {
  exchangeForLongLivedThreadsToken,
  exchangeThreadsCode,
  fetchThreadsProfile,
  getThreadsAppId,
  getThreadsAppSecret,
  getThreadsRedirectUri
} from "@/lib/integrations/threads";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const brandId = requestUrl.searchParams.get("state");
  const appId = getThreadsAppId();
  const appSecret = getThreadsAppSecret();
  const redirectUri = getThreadsRedirectUri(request);

  if (!code || !brandId) {
    return NextResponse.json({ error: "Missing Threads OAuth callback parameters." }, { status: 400 });
  }

  if (!appId || !appSecret) {
    return NextResponse.json({ error: "Threads OAuth is not configured." }, { status: 400 });
  }

  const shortLivedToken = await exchangeThreadsCode({ code, appId, appSecret, redirectUri });
  const longLivedToken = await exchangeForLongLivedThreadsToken({
    accessToken: shortLivedToken.access_token,
    appSecret
  });
  const profile = await fetchThreadsProfile({
    userId: shortLivedToken.user_id,
    accessToken: longLivedToken.access_token
  });
  const expiresAt = longLivedToken.expires_in ? new Date(Date.now() + longLivedToken.expires_in * 1000) : null;
  const existingAccount = await db.socialAccount.findFirst({
    where: { brandId, platform: Platform.THREADS }
  });
  const displayName = profile.username ? `@${profile.username}` : profile.name ?? "Threads";

  if (existingAccount) {
    await db.socialAccount.update({
      where: { id: existingAccount.id },
      data: {
        connected: true,
        tokenStatus: "connected",
        accessToken: longLivedToken.access_token,
        refreshToken: shortLivedToken.access_token,
        expiresAt,
        externalId: profile.id,
        displayName,
        accountName: "Threads"
      }
    });
  } else {
    await db.socialAccount.create({
      data: {
        brandId,
        platform: Platform.THREADS,
        displayName,
        externalId: profile.id,
        connected: true,
        tokenStatus: "connected",
        accessToken: longLivedToken.access_token,
        refreshToken: shortLivedToken.access_token,
        expiresAt,
        accountName: "Threads"
      }
    });
  }

  return NextResponse.redirect(new URL(`/?brandId=${encodeURIComponent(brandId)}`, request.url));
}
