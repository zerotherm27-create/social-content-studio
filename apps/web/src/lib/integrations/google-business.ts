import { Platform } from "../domain";

export const GOOGLE_BUSINESS_SCOPE = "https://www.googleapis.com/auth/business.manage";

type OAuthUrlInput = {
  clientId: string;
  redirectUri: string;
  state: string;
};

type GoogleBusinessDraft = {
  platform: string;
  caption: string;
};

type CreateLocalPostInput = {
  accessToken: string;
  locationName: string;
  draft: GoogleBusinessDraft;
  callToActionUrl?: string;
  fetcher?: typeof fetch;
};

export function buildGoogleBusinessOAuthUrl(input: OAuthUrlInput) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_BUSINESS_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", input.state);
  return url;
}

export function buildGoogleBusinessPostPayload(input: { caption: string; callToActionUrl?: string }) {
  return {
    languageCode: "en-US",
    summary: input.caption,
    topicType: "STANDARD",
    ...(input.callToActionUrl
      ? {
          callToAction: {
            actionType: "LEARN_MORE",
            url: input.callToActionUrl
          }
        }
      : {})
  };
}

export async function createGoogleBusinessLocalPost(input: CreateLocalPostInput) {
  if (input.draft.platform !== Platform.GOOGLE_BUSINESS) {
    throw new Error("Draft is not for Google Business Profile.");
  }

  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher(`https://mybusiness.googleapis.com/v4/${input.locationName}/localPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(
      buildGoogleBusinessPostPayload({
        caption: input.draft.caption,
        callToActionUrl: input.callToActionUrl
      })
    )
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Business Profile post failed: ${response.status} ${message}`);
  }

  return response.json() as Promise<{ name: string }>;
}

export async function exchangeGoogleBusinessCode(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetcher?: typeof fetch;
}) {
  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google OAuth token exchange failed: ${response.status} ${message}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  }>;
}
