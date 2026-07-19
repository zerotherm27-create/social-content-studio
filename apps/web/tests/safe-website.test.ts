import { afterEach, describe, expect, it, vi } from "vitest";
import { isPrivateIp, readPublicBrandAssets, readPublicWebsite } from "@/lib/safe-website";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isPrivateIp", () => {
  it("blocks local and private network ranges", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.0.0.2")).toBe(true);
    expect(isPrivateIp("192.168.1.2")).toBe(true);
    expect(isPrivateIp("172.20.0.2")).toBe(true);
    expect(isPrivateIp("::1")).toBe(true);
  });

  it("allows public addresses", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
  });
});

describe("readPublicWebsite", () => {
  it("follows a public redirect and extracts the final page", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 308, headers: { location: "https://1.1.1.1/" } }))
      .mockResolvedValueOnce(new Response("<title>Example</title><p>Public page</p>", { status: 200, headers: { "content-type": "text/html" } }));
    vi.stubGlobal("fetch", fetcher);

    const evidence = await readPublicWebsite("https://93.184.216.34");

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[1][0])).toBe("https://1.1.1.1/");
    expect(evidence).toMatchObject({ pageTitle: "Example", pageText: "Example Public page" });
  });

  it("retries a temporary website connection failure", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(new Response("<title>Recovered</title><p>Website text</p>", { status: 200, headers: { "content-type": "text/html" } }));
    vi.stubGlobal("fetch", fetcher);

    const evidence = await readPublicWebsite("https://93.184.216.34");

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(evidence.pageTitle).toBe("Recovered");
  });
});

describe("readPublicBrandAssets", () => {
  it("selects real hero photography and a logo from a public brand website", async () => {
    const html = `
      <meta name="theme-color" content="#1266cc">
      <style>:root { --brand: #44aa55; }</style>
      <meta property="og:image" content="/fallback.jpg">
      <img src="/images/hero-team.jpg" alt="Brand staff serving customers">
      <img src="/logo-white.png" alt="Brand logo">
    `;
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(html, { status: 200, headers: { "content-type": "text/html" } }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/jpeg" } }))
      .mockResolvedValueOnce(new Response(new Uint8Array([4, 5, 6]), { status: 200, headers: { "content-type": "image/png" } }));
    vi.stubGlobal("fetch", fetcher);

    const assets = await readPublicBrandAssets("https://93.184.216.34");

    expect(assets.websiteHost).toBe("93.184.216.34");
    expect(assets.heroImage).toMatch(/^data:image\/jpeg;base64,/);
    expect(assets.logoImage).toMatch(/^data:image\/png;base64,/);
    expect(assets.brandColor).toBe("#1266cc");
    expect(assets.accentColor).toBe("#44aa55");
    expect(String(fetcher.mock.calls[1][0])).toBe("https://93.184.216.34/images/hero-team.jpg");
    expect(String(fetcher.mock.calls[2][0])).toBe("https://93.184.216.34/logo-white.png");
  });
});
