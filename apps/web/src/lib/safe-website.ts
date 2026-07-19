import { resolve4, resolve6 } from "node:dns/promises";
import { isIP } from "node:net";

export async function readPublicWebsite(rawUrl: string) {
  const { response } = await fetchPublicResource(rawUrl, "OrbitBrandReader/1.0");
  if (!response.ok) throw new Error(`Website returned ${response.status}.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error("Website must return an HTML page.");
  const html = (await response.text()).slice(0, 500_000);
  return extractPageEvidence(html);
}

export type PublicBrandAssets = {
  heroImage?: string;
  logoImage?: string;
  brandColor?: string;
  accentColor?: string;
  websiteHost: string;
};

export async function readPublicBrandAssets(rawUrl: string): Promise<PublicBrandAssets> {
  const { response, finalUrl } = await fetchPublicResource(rawUrl, "OrbitBrandArtCard/1.0");
  if (!response.ok) throw new Error(`Brand website returned ${response.status}.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error("Brand website must return an HTML page.");
  const html = (await response.text()).slice(0, 500_000);
  const candidates = extractBrandImageCandidates(html, finalUrl);

  const [heroResult, logoResult] = await Promise.allSettled([
    candidates.hero ? readPublicImage(candidates.hero) : Promise.resolve(undefined),
    candidates.logo ? readPublicImage(candidates.logo) : Promise.resolve(undefined)
  ]);

  return {
    heroImage: heroResult.status === "fulfilled" ? heroResult.value : undefined,
    logoImage: logoResult.status === "fulfilled" ? logoResult.value : undefined,
    ...extractBrandColors(html),
    websiteHost: finalUrl.hostname.replace(/^www\./, "")
  };
}

async function fetchPublicResource(rawUrl: string, userAgent: string) {
  let url = new URL(rawUrl);
  let response: Response | undefined;

  for (let redirects = 0; redirects <= 5; redirects += 1) {
    assertSupportedWebsiteUrl(url);
    await assertPublicHost(url.hostname);
    response = await fetchWebsite(url, userAgent);
    if (![301, 302, 303, 307, 308].includes(response.status)) break;

    const location = response.headers.get("location");
    if (!location) throw new Error("Website returned a redirect without a destination.");
    if (redirects === 5) throw new Error("Website redirected too many times.");
    url = new URL(location, url);
  }

  if (!response) throw new Error("Website could not be read.");
  return { response, finalUrl: url };
}

async function readPublicImage(rawUrl: string) {
  const { response } = await fetchPublicResource(rawUrl, "OrbitBrandArtCard/1.0");
  if (!response.ok) throw new Error(`Brand image returned ${response.status}.`);
  const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
  if (!contentType.startsWith("image/")) throw new Error("Brand asset is not an image.");
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > 6_000_000) throw new Error("Brand image is too large.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 6_000_000) throw new Error("Brand image is too large.");
  return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
}

async function fetchWebsite(url: URL, userAgent = "OrbitBrandReader/1.0") {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(12_000),
        headers: { "User-Agent": userAgent }
      });
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof DOMException && lastError.name === "TimeoutError") {
    throw new Error("The website took too long to respond. Please try again.");
  }
  throw new Error("Could not reach the website. Please try again.");
}

function extractBrandImageCandidates(html: string, pageUrl: URL) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const ogImageTag = metaTags.find((tag) => /(?:property|name)=["'](?:og:image|twitter:image)["']/i.test(tag));
  const ogImage = ogImageTag ? getHtmlAttribute(ogImageTag, "content") : "";

  const images = imageTags
    .map((tag, index) => {
      const src = decodeHtml(getHtmlAttribute(tag, "src"));
      const alt = decodeHtml(getHtmlAttribute(tag, "alt"));
      const combined = `${src} ${alt}`.toLowerCase();
      let heroScore = 0;
      let logoScore = 0;
      if (/hero|banner|cover/.test(combined)) heroScore += 8;
      if (/staff|team|store|interior|service|product|project|laundry|customer/.test(combined)) heroScore += 4;
      if (/logo|brandmark/.test(combined)) logoScore += 10;
      if (/white/.test(combined)) logoScore += 3;
      if (/icon|avatar|favicon/.test(combined)) heroScore -= 8;
      if (/logo/.test(combined)) heroScore -= 12;
      return { src, heroScore, logoScore, index };
    })
    .filter((item) => item.src && !item.src.startsWith("data:"));

  const hero = images.sort((a, b) => b.heroScore - a.heroScore || a.index - b.index)[0];
  const logo = [...images].sort((a, b) => b.logoScore - a.logoScore || a.index - b.index)[0];
  return {
    hero: resolveAssetUrl(hero?.heroScore && hero.heroScore > 0 ? hero.src : ogImage, pageUrl),
    logo: resolveAssetUrl(logo?.logoScore && logo.logoScore > 0 ? logo.src : "", pageUrl)
  };
}

function extractBrandColors(html: string) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const themeColorTag = metaTags.find((tag) => /name=["']theme-color["']/i.test(tag));
  const themeColor = normalizeHexColor(themeColorTag ? getHtmlAttribute(themeColorTag, "content") : "");
  const candidates = Array.from(html.matchAll(/#[0-9a-f]{3,6}\b/gi))
    .map((match) => normalizeHexColor(match[0]))
    .filter((color): color is string => Boolean(color))
    .filter((color) => !isLowValueColor(color));
  const unique = Array.from(new Set([themeColor, ...candidates].filter((color): color is string => Boolean(color))));

  return {
    brandColor: unique[0],
    accentColor: unique.find((color) => color !== unique[0])
  };
}

function normalizeHexColor(value: string) {
  const color = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (!color) return undefined;
  if (color.length === 3) return `#${color.split("").map((part) => part + part).join("")}`.toLowerCase();
  return `#${color.toLowerCase()}`;
}

function isLowValueColor(color: string) {
  const [r, g, b] = [color.slice(1, 3), color.slice(3, 5), color.slice(5, 7)].map((part) => Number.parseInt(part, 16));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max < 32 || min > 238 || max - min < 10;
}

function getHtmlAttribute(tag: string, name: string) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? "";
}

function resolveAssetUrl(value: string, pageUrl: URL) {
  if (!value) return undefined;
  try {
    return new URL(decodeHtml(value), pageUrl).toString();
  } catch {
    return undefined;
  }
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/gi, "&").replace(/&#x2F;/gi, "/").replace(/&#47;/gi, "/");
}

function assertSupportedWebsiteUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Website URL must use http or https.");
  if (url.username || url.password) throw new Error("Website URL cannot contain credentials.");
}

export function isPrivateIp(address: string) {
  const normalized = address.toLowerCase();
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (isIP(address) === 6) return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
  return true;
}

async function assertPublicHost(hostname: string) {
  if (hostname === "localhost" || hostname.endsWith(".local")) throw new Error("Private website addresses are not allowed.");
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("Private website addresses are not allowed.");
    return;
  }
  const addresses = [...await resolve4(hostname).catch(() => []), ...await resolve6(hostname).catch(() => [])];
  if (!addresses.length || addresses.some(isPrivateIp)) throw new Error("Website must resolve to a public address.");
}

function extractPageEvidence(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)?.[1]
    ?? "";
  const pageText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);
  return { pageTitle: clean(title), description: clean(description), pageText };
}

function clean(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
