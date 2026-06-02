import { describe, expect, it, vi } from "vitest";
import { Platform } from "@/lib/domain";
import {
  buildGoogleBusinessOAuthUrl,
  buildGoogleBusinessPostPayload,
  createGoogleBusinessLocalPost
} from "@/lib/integrations/google-business";

describe("buildGoogleBusinessOAuthUrl", () => {
  it("builds a Google OAuth consent URL with business.manage scope and offline access", () => {
    const url = buildGoogleBusinessOAuthUrl({
      clientId: "client-id",
      redirectUri: "http://127.0.0.1:3001/api/integrations/google/callback",
      state: "brand-123"
    });

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.pathname).toBe("/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:3001/api/integrations/google/callback");
    expect(url.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/business.manage");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("brand-123");
  });
});

describe("buildGoogleBusinessPostPayload", () => {
  it("creates a standard Google Business Profile update payload from a draft", () => {
    const payload = buildGoogleBusinessPostPayload({
      caption: "New cold brew flight is available this week.",
      callToActionUrl: "https://lunabrew.example/menu"
    });

    expect(payload).toEqual({
      languageCode: "en-US",
      summary: "New cold brew flight is available this week.",
      topicType: "STANDARD",
      callToAction: {
        actionType: "LEARN_MORE",
        url: "https://lunabrew.example/menu"
      }
    });
  });
});

describe("createGoogleBusinessLocalPost", () => {
  it("posts the local update to the Google Business Profile localPosts endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "accounts/1/locations/2/localPosts/3"
      })
    });

    const result = await createGoogleBusinessLocalPost({
      accessToken: "access-token",
      locationName: "accounts/1/locations/2",
      draft: {
        platform: Platform.GOOGLE_BUSINESS,
        caption: "New cold brew flight is available this week."
      },
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://mybusiness.googleapis.com/v4/accounts/1/locations/2/localPosts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
          "Content-Type": "application/json"
        })
      })
    );
    expect(result.name).toBe("accounts/1/locations/2/localPosts/3");
  });
});
