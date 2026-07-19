import { describe, expect, it, vi } from "vitest";
import {
  buildThreadsOAuthUrl,
  createThreadsTextPost,
  exchangeForLongLivedThreadsToken,
  exchangeThreadsCode,
  fetchThreadsProfile,
  THREADS_SCOPES
} from "@/lib/integrations/threads";

describe("buildThreadsOAuthUrl", () => {
  it("builds the Threads authorization URL with publishing scopes", () => {
    const url = buildThreadsOAuthUrl({
      appId: "threads-app-id",
      redirectUri: "https://orbit-social-agent.vercel.app/api/integrations/threads/callback",
      state: "brand-123"
    });

    expect(url.origin).toBe("https://threads.com");
    expect(url.pathname).toBe("/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("threads-app-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://orbit-social-agent.vercel.app/api/integrations/threads/callback");
    expect(url.searchParams.get("scope")).toBe(THREADS_SCOPES.join(","));
    expect(url.searchParams.get("scope")).toContain("threads_basic");
    expect(url.searchParams.get("scope")).toContain("threads_content_publish");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("brand-123");
  });
});

describe("Threads OAuth", () => {
  it("exchanges an authorization code for a short-lived token", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "short-token", user_id: "threads-user-1" })
    });

    const token = await exchangeThreadsCode({
      code: "code-123",
      appId: "app-id",
      appSecret: "app-secret",
      redirectUri: "https://example.com/callback",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://graph.threads.net/oauth/access_token",
      expect.objectContaining({ method: "POST" })
    );
    expect(token).toEqual({ access_token: "short-token", user_id: "threads-user-1" });
  });

  it("exchanges a short-lived token for a long-lived token", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "long-token", expires_in: 5184000 })
    });

    const token = await exchangeForLongLivedThreadsToken({
      accessToken: "short-token",
      appSecret: "app-secret",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ hostname: "graph.threads.net", pathname: "/access_token" }));
    expect(token.access_token).toBe("long-token");
  });
});

describe("Threads profile and publishing", () => {
  it("fetches a Threads profile", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "threads-user-1", username: "thelaundryprojectph" })
    });

    const profile = await fetchThreadsProfile({
      userId: "threads-user-1",
      accessToken: "long-token",
      graphVersion: "v1.0",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/v1.0/threads-user-1" }));
    expect(profile.username).toBe("thelaundryprojectph");
  });

  it("creates and publishes a Threads text post", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "container-1" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "threads-post-1" })
      });

    const post = await createThreadsTextPost({
      userId: "threads-user-1",
      accessToken: "long-token",
      text: "Laundry pickup is open today.",
      graphVersion: "v1.0",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][0]).toBe("https://graph.threads.net/v1.0/threads-user-1/threads");
    expect((fetcher.mock.calls[0][1].body as URLSearchParams).get("media_type")).toBe("TEXT");
    expect((fetcher.mock.calls[0][1].body as URLSearchParams).get("text")).toBe("Laundry pickup is open today.");
    expect(fetcher.mock.calls[1][0]).toBe("https://graph.threads.net/v1.0/threads-user-1/threads_publish");
    expect(post.id).toBe("threads-post-1");
  });
});
