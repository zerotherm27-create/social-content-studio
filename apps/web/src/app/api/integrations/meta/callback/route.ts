import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Platform } from "@/lib/domain";
import {
  exchangeForLongLivedMetaToken,
  exchangeMetaCode,
  fetchInstagramBusinessAccount,
  fetchManagedMetaPages,
  getMetaRedirectUri,
  selectBestMetaPageForBrand
} from "@/lib/integrations/meta";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const brandId = requestUrl.searchParams.get("state");
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const redirectUri = getMetaRedirectUri(request);

  if (!code || !brandId) {
    return NextResponse.json({ error: "Missing Meta OAuth callback parameters." }, { status: 400 });
  }

  if (!appId || !appSecret) {
    return NextResponse.json({ error: "Meta OAuth is not configured." }, { status: 400 });
  }

  const shortLivedToken = await exchangeMetaCode({ code, appId, appSecret, redirectUri });
  const longLivedToken = await exchangeForLongLivedMetaToken({
    accessToken: shortLivedToken.access_token,
    appId,
    appSecret
  });
  const brand = await db.brand.findUnique({
    where: { id: brandId },
    select: {
      name: true,
      socialAccounts: {
        where: { platform: Platform.FACEBOOK },
        select: { displayName: true, externalId: true },
        take: 1
      }
    }
  });

  if (!brand) {
    return NextResponse.json({ error: "Brand not found for Meta OAuth callback." }, { status: 404 });
  }

  const pages = await fetchManagedMetaPages({ accessToken: longLivedToken.access_token });
  const existingFacebookAccount = brand.socialAccounts[0];
  const page = selectBestMetaPageForBrand(
    pages,
    brand.name,
    existingFacebookAccount?.displayName,
    existingFacebookAccount?.externalId
  );

  if (!page) {
    return NextResponse.json(
      {
        error:
          "Facebook did not share a managed Page. Reconnect, approve all requested permissions, and select the Page you want to use. The Facebook profile must have full control of that Page in its Meta Business Portfolio."
      },
      { status: 400 }
    );
  }

  const expiresAt = longLivedToken.expires_in ? new Date(Date.now() + longLivedToken.expires_in * 1000) : null;
  const existingAccount = await db.socialAccount.findFirst({
    where: { brandId, platform: Platform.FACEBOOK }
  });

  if (existingAccount) {
    await db.socialAccount.update({
      where: { id: existingAccount.id },
      data: {
      connected: true,
      tokenStatus: "connected",
      accessToken: page.access_token,
      refreshToken: longLivedToken.access_token,
      expiresAt,
      externalId: page.id,
      displayName: page.name,
      accountName: page.category ?? null
      }
    });
  } else {
    await db.socialAccount.create({
      data: {
      brandId,
      platform: Platform.FACEBOOK,
      displayName: page.name,
      externalId: page.id,
      connected: true,
      tokenStatus: "connected",
      accessToken: page.access_token,
      refreshToken: longLivedToken.access_token,
      expiresAt,
      accountName: page.category ?? null
      }
    });
  }

  const instagramAccount = await fetchInstagramBusinessAccount({
    pageId: page.id,
    pageAccessToken: page.access_token
  }).catch(() => undefined);

  if (instagramAccount) {
    const existingInstagramAccount = await db.socialAccount.findFirst({
      where: { brandId, platform: Platform.INSTAGRAM }
    });
    const instagramDisplayName =
      instagramAccount.username ? `@${instagramAccount.username}` : instagramAccount.name ?? `${brand.name} Instagram`;

    if (existingInstagramAccount) {
      await db.socialAccount.update({
        where: { id: existingInstagramAccount.id },
        data: {
          connected: true,
          tokenStatus: "connected",
          accessToken: page.access_token,
          refreshToken: longLivedToken.access_token,
          expiresAt,
          externalId: instagramAccount.id,
          displayName: instagramDisplayName,
          accountName: "Instagram Business"
        }
      });
    } else {
      await db.socialAccount.create({
        data: {
          brandId,
          platform: Platform.INSTAGRAM,
          displayName: instagramDisplayName,
          externalId: instagramAccount.id,
          connected: true,
          tokenStatus: "connected",
          accessToken: page.access_token,
          refreshToken: longLivedToken.access_token,
          expiresAt,
          accountName: "Instagram Business"
        }
      });
    }
  }

  return NextResponse.redirect(new URL(`/?brandId=${encodeURIComponent(brandId)}`, request.url));
}
