import { describe, expect, it, vi } from "vitest";
import {
  buildMetaOAuthUrl,
  createInstagramImagePost,
  createMetaPagePost,
  fetchInstagramBusinessAccount,
  fetchManagedMetaPages,
  fetchMetaPagePosts,
  getMetaRedirectUri,
  MetaPagePostsPermissionError,
  META_PAGE_READ_SCOPES,
  selectBestMetaPageForBrand,
  summarizeMetaPosts
} from "@/lib/integrations/meta";

describe("buildMetaOAuthUrl", () => {
  it("builds a Meta OAuth URL with Page read scopes", () => {
    const url = buildMetaOAuthUrl({
      appId: "meta-app-id",
      redirectUri: "http://127.0.0.1:3001/api/integrations/meta/callback",
      state: "brand-123",
      graphVersion: "v23.0"
    });

    expect(url.origin).toBe("https://www.facebook.com");
    expect(url.pathname).toBe("/v23.0/dialog/oauth");
    expect(url.searchParams.get("client_id")).toBe("meta-app-id");
    expect(url.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:3001/api/integrations/meta/callback");
    expect(url.searchParams.get("scope")).toBe(META_PAGE_READ_SCOPES.join(","));
    expect(url.searchParams.get("scope")).toContain("business_management");
    expect(url.searchParams.get("scope")).toContain("pages_manage_posts");
    expect(url.searchParams.get("scope")).toContain("instagram_basic");
    expect(url.searchParams.get("scope")).toContain("instagram_content_publish");
    expect(url.searchParams.get("scope")).not.toContain("pages_read_user_content");
    expect(url.searchParams.get("auth_type")).toBe("rerequest");
    expect(url.searchParams.get("state")).toBe("brand-123");
  });
});

describe("createMetaPagePost", () => {
  it("publishes a text post to the managed Facebook Page feed", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "page-1_post-1" })
    });

    const result = await createMetaPagePost({
      pageId: "page-1",
      pageAccessToken: "page-token",
      message: "Laundry pickup is open today.",
      link: "https://example.com",
      graphVersion: "v23.0",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://graph.facebook.com/v23.0/page-1/feed",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/x-www-form-urlencoded" })
      })
    );
    const body = fetcher.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("message")).toBe("Laundry pickup is open today.");
    expect(body.get("link")).toBe("https://example.com");
    expect(body.get("access_token")).toBe("page-token");
    expect(result.id).toBe("page-1_post-1");
  });
});

describe("Instagram Business integration", () => {
  it("finds the Instagram Business account linked to a Facebook Page", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        instagram_business_account: { id: "ig-1", username: "thelaundryprojectph" }
      })
    });

    const account = await fetchInstagramBusinessAccount({
      pageId: "page-1",
      pageAccessToken: "page-token",
      graphVersion: "v23.0",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/v23.0/page-1" }));
    expect(account).toEqual({ id: "ig-1", username: "thelaundryprojectph" });
  });

  it("creates and publishes an Instagram image media container", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "container-1" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "ig-media-1" })
      });

    const result = await createInstagramImagePost({
      igUserId: "ig-1",
      pageAccessToken: "page-token",
      imageUrl: "https://example.com/artcard.png",
      caption: "Book pickup today.",
      graphVersion: "v23.0",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][0]).toBe("https://graph.facebook.com/v23.0/ig-1/media");
    expect((fetcher.mock.calls[0][1].body as URLSearchParams).get("image_url")).toBe("https://example.com/artcard.png");
    expect(fetcher.mock.calls[1][0]).toBe("https://graph.facebook.com/v23.0/ig-1/media_publish");
    expect((fetcher.mock.calls[1][1].body as URLSearchParams).get("creation_id")).toBe("container-1");
    expect(result.id).toBe("ig-media-1");
  });
});

describe("getMetaRedirectUri", () => {
  it("matches the active local host when localhost and 127.0.0.1 differ", () => {
    vi.stubEnv("META_REDIRECT_URI", "http://localhost:3001/api/integrations/meta/callback");

    expect(getMetaRedirectUri(new URL("http://127.0.0.1:3001/api/integrations/meta/connect"))).toBe(
      "http://127.0.0.1:3001/api/integrations/meta/callback"
    );
  });

  it("uses the production origin when the configured value is local", () => {
    vi.stubEnv("META_REDIRECT_URI", "http://localhost:3001/api/integrations/meta/callback");

    expect(getMetaRedirectUri(new URL("https://orbit-social-agent.vercel.app/api/integrations/meta/connect"))).toBe(
      "https://orbit-social-agent.vercel.app/api/integrations/meta/callback"
    );
  });

  it("keeps the OAuth round trip on the local app when production is configured", () => {
    vi.stubEnv("META_REDIRECT_URI", "https://orbit-social-agent.vercel.app/api/integrations/meta/callback");

    expect(getMetaRedirectUri(new URL("http://127.0.0.1:3001/api/integrations/meta/connect"))).toBe(
      "http://127.0.0.1:3001/api/integrations/meta/callback"
    );
  });

  it("keeps the configured callback when it matches the active app origin", () => {
    vi.stubEnv("META_REDIRECT_URI", "https://orbit-social-agent.vercel.app/api/integrations/meta/callback");

    expect(getMetaRedirectUri(new URL("https://orbit-social-agent.vercel.app/api/integrations/meta/connect"))).toBe(
      "https://orbit-social-agent.vercel.app/api/integrations/meta/callback"
    );
  });

  it("uses the browser host header when the dev server request URL is internal", () => {
    vi.stubEnv("META_REDIRECT_URI", "http://localhost:3001/api/integrations/meta/callback");

    expect(
      getMetaRedirectUri(
        new Request("http://0.0.0.0:3001/api/integrations/meta/connect", {
          headers: { host: "127.0.0.1:3001" }
        })
      )
    ).toBe("http://127.0.0.1:3001/api/integrations/meta/callback");
  });
});

describe("fetchManagedMetaPages", () => {
  it("returns pages from /me/accounts", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: "page-1", name: "Luna Brew", access_token: "page-token", category: "Cafe" }]
      })
    });

    const pages = await fetchManagedMetaPages({
      accessToken: "user-token",
      graphVersion: "v23.0",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/v23.0/me/accounts" }));
    expect(pages[0]).toEqual({ id: "page-1", name: "Luna Brew", access_token: "page-token", category: "Cafe" });
  });

  it("falls back to assigned Pages for Business Portfolio access", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: "page-2", name: "Safety Margin", access_token: "assigned-page-token", tasks: ["MANAGE"] }]
        })
      });

    const pages = await fetchManagedMetaPages({
      accessToken: "user-token",
      graphVersion: "v23.0",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][0]).toEqual(expect.objectContaining({ pathname: "/v23.0/me/accounts" }));
    expect(fetcher.mock.calls[1][0]).toEqual(expect.objectContaining({ pathname: "/v23.0/me/assigned_pages" }));
    expect(pages[0]).toEqual({
      id: "page-2",
      name: "Safety Margin",
      access_token: "assigned-page-token",
      tasks: ["MANAGE"]
    });
  });
});

describe("selectBestMetaPageForBrand", () => {
  it("prefers the Facebook Page that matches the brand name over the first returned Page", () => {
    const page = selectBestMetaPageForBrand(
      [
        { id: "page-1", name: "UnliBubbles", access_token: "wrong-page-token" },
        { id: "page-2", name: "The Laundry Project", access_token: "right-page-token" }
      ],
      "The Laundry Project"
    );

    expect(page).toEqual({ id: "page-2", name: "The Laundry Project", access_token: "right-page-token" });
  });

  it("uses the existing external id when no brand-name match is available", () => {
    const page = selectBestMetaPageForBrand(
      [
        { id: "page-1", name: "UnliBubbles", access_token: "first-page-token" },
        { id: "page-2", name: "Laundry Express", access_token: "existing-page-token" }
      ],
      "The Laundry Project",
      "The Laundry Project Facebook",
      "page-2"
    );

    expect(page?.id).toBe("page-2");
  });
});

describe("fetchMetaPagePosts", () => {
  it("reads recent Page posts", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: "post-1", message: "Cold brew flight is live.", reactions: { summary: { total_count: 12 } } }]
      })
    });

    const posts = await fetchMetaPagePosts({
      pageId: "page-1",
      pageAccessToken: "page-token",
      graphVersion: "v23.0",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/v23.0/page-1/published_posts" }));
    const requestedUrl = fetcher.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get("fields")).toBe("id,message,created_time,permalink_url");
    expect(requestedUrl.searchParams.get("fields")).not.toContain("comments");
    expect(posts[0].message).toBe("Cold brew flight is live.");
  });

  it("turns Meta permission failures into a useful customer-facing error", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            message: "This endpoint requires pages_read_user_content or Page Public Content Access.",
            code: 10
          }
        })
    });

    await expect(
      fetchMetaPagePosts({
        pageId: "page-1",
        pageAccessToken: "page-token",
        graphVersion: "v23.0",
        fetcher
      })
    ).rejects.toBeInstanceOf(MetaPagePostsPermissionError);
  });
});

describe("summarizeMetaPosts", () => {
  it("formats post text with engagement context", () => {
    const summary = summarizeMetaPosts([
      {
        id: "post-1",
        message: "Cold brew flight is live.",
        created_time: "2026-07-13T08:00:00+0000",
        reactions: { summary: { total_count: 12 } },
        comments: { summary: { total_count: 3 } },
        shares: { count: 2 }
      }
    ]);

    expect(summary).toContain("Cold brew flight is live.");
    expect(summary).toContain("12 reactions, 3 comments, 2 shares");
  });
});
