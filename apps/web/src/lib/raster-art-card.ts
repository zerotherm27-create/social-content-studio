import sharp from "sharp";

export type RasterArtCardInput = {
  brandName: string;
  headline: string;
  subline: string;
  visualDirection: string;
  platform?: string;
  brandColor?: string;
  accentColor?: string;
  websiteHost?: string;
  photo: Buffer;
  photoContentType: string;
};

type RasterArtCardResult = {
  body: Buffer;
  contentType: "image/png";
};

export async function createRasterArtCard(input: RasterArtCardInput): Promise<RasterArtCardResult> {
  const format = getRasterArtCardFormat(input.platform);
  const palette = {
    brand: normalizeHex(input.brandColor) ?? "#299CB6",
    accent: normalizeHex(input.accentColor) ?? "#F9CA47",
    ink: "#18211b",
    paper: "#fffaf0"
  };

  const photo = await sharp(input.photo, { failOn: "none" })
    .rotate()
    .resize(format.width, format.height, { fit: "cover" })
    .modulate({ brightness: 1.06, saturation: 1.05 })
    .png()
    .toBuffer();

  const overlay = Buffer.from(createOverlayMarkup({
    ...input,
    width: format.width,
    height: format.height,
    brandColor: palette.brand,
    accentColor: palette.accent,
    ink: palette.ink,
    paper: palette.paper
  }));

  const body = await sharp(photo)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 8, adaptiveFiltering: true })
    .toBuffer();

  return { body, contentType: "image/png" };
}

export async function isUsableRasterImage(body: Buffer) {
  const image = sharp(body, { failOn: "none" });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || metadata.width < 512 || metadata.height < 512) return false;

  const stats = await image.stats();
  const channels = stats.channels.slice(0, 3);
  const meanBrightness = channels.reduce((sum, channel) => sum + channel.mean, 0) / channels.length;
  const averageDeviation = channels.reduce((sum, channel) => sum + channel.stdev, 0) / channels.length;

  return meanBrightness >= 35 && averageDeviation >= 10;
}

export function buildRasterPhotoPrompt(input: {
  brandName: string;
  headline: string;
  subline: string;
  visualDirection: string;
  platform?: string;
  brandColor?: string;
  accentColor?: string;
  websiteHost?: string;
  audience?: string;
  offerContext?: string;
  campaignGoal?: string;
}) {
  return [
    "Generate the real photographic/illustrative visual foundation for a social media art card.",
    "This is not the full poster. Do not render text, logos, captions, buttons, frames, UI cards, icons, black panels, blank panels, or empty graphic blocks.",
    "Create a bright, useful, brand-native image that can sit behind readable marketing copy.",
    "Use real-world objects, service moments, clean product/category visuals, or a premium editorial still life that proves the offer.",
    "Keep the composition bright, full-frame, high-detail, and commercially usable. Avoid black backgrounds, dark empty space, vignettes, underexposure, blank rectangles, and solid color cards.",
    "Leave gentle negative space near the lower third for copy, but keep that area photographic and visually alive.",
    `Brand: ${input.brandName}.`,
    `Image should support this headline without rendering words: ${input.headline}.`,
    `Image should support this benefit without rendering words: ${input.subline}.`,
    input.audience ? `Target customer: ${input.audience}.` : "",
    input.offerContext ? `Verified offer/context: ${input.offerContext}.` : "",
    input.campaignGoal ? `Marketing objective: ${input.campaignGoal}.` : "",
    input.brandColor ? `Use brand color ${input.brandColor} naturally in props, packaging, environment accents, or background details.` : "",
    input.accentColor ? `Use accent color ${input.accentColor} sparingly as a warm secondary detail.` : "",
    input.websiteHost ? `Brand reference domain only: ${input.websiteHost}.` : "",
    `Visual direction: ${input.visualDirection}.`
  ].filter(Boolean).join(" ");
}

function getRasterArtCardFormat(platform?: string) {
  switch (platform) {
    case "TIKTOK":
    case "INSTAGRAM_STORY":
      return { width: 1080, height: 1920 };
    case "GOOGLE_BUSINESS":
      return { width: 1200, height: 900 };
    default:
      return { width: 1080, height: 1350 };
  }
}

function createOverlayMarkup(input: RasterArtCardInput & {
  width: number;
  height: number;
  brandColor: string;
  accentColor: string;
  ink: string;
  paper: string;
}) {
  const pad = Math.round(input.width * 0.065);
  const panelWidth = input.width - pad * 2;
  const panelHeight = Math.round(input.height * 0.34);
  const panelY = input.height - panelHeight - pad;
  const logo = abbreviate(input.brandName);
  const cta = getCardCta(input);
  const headlineLines = wrapText(input.headline, input.width > 1100 ? 28 : 22, 3);
  const sublineLines = wrapText(input.subline, input.width > 1100 ? 44 : 34, 3);
  const titleSize = input.width > 1100 ? 56 : 64;
  const subSize = input.width > 1100 ? 26 : 30;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}">
  <defs>
    <linearGradient id="topShade" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#101510" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="100%" height="${Math.round(input.height * 0.38)}" fill="url(#topShade)"/>
  <g transform="translate(${pad}, ${pad})">
    <rect width="${Math.round(input.width * 0.32)}" height="70" rx="20" fill="${escapeXml(input.paper)}" fill-opacity="0.94"/>
    <rect x="14" y="14" width="42" height="42" rx="12" fill="${escapeXml(input.brandColor)}"/>
    <text x="35" y="42" text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900">${escapeXml(logo)}</text>
    <text x="70" y="43" fill="${escapeXml(input.ink)}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900">${escapeXml(truncate(input.brandName, 24))}</text>
  </g>
  <g filter="url(#softShadow)">
    <rect x="${pad}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="34" fill="${escapeXml(input.paper)}" fill-opacity="0.96"/>
    <rect x="${pad}" y="${panelY}" width="18" height="${panelHeight}" rx="9" fill="${escapeXml(input.accentColor)}"/>
    <rect x="${pad + 36}" y="${panelY + 32}" width="124" height="30" rx="15" fill="${escapeXml(input.brandColor)}"/>
    <text x="${pad + 98}" y="${panelY + 53}" text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900">${escapeXml(getFormatLabel(input.visualDirection))}</text>
    ${headlineLines.map((line, index) => `<text x="${pad + 36}" y="${panelY + 118 + index * Math.round(titleSize * 0.94)}" fill="${escapeXml(input.ink)}" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="900">${escapeXml(line)}</text>`).join("")}
    ${sublineLines.map((line, index) => `<text x="${pad + 38}" y="${panelY + 270 + index * Math.round(subSize * 1.28)}" fill="#4b554d" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" font-weight="700">${escapeXml(line)}</text>`).join("")}
    <rect x="${pad + 38}" y="${input.height - pad - 76}" width="210" height="48" rx="18" fill="${escapeXml(input.accentColor)}"/>
    <text x="${pad + 143}" y="${input.height - pad - 44}" text-anchor="middle" fill="${escapeXml(input.ink)}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900">${escapeXml(cta)}</text>
    ${input.websiteHost ? `<text x="${input.width - pad - 36}" y="${input.height - pad - 45}" text-anchor="end" fill="#657067" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800">${escapeXml(input.websiteHost.toUpperCase())}</text>` : ""}
  </g>
</svg>`;
}

function getCardCta(input: Pick<RasterArtCardInput, "headline" | "subline" | "visualDirection">) {
  const text = `${input.headline} ${input.subline} ${input.visualDirection}`.toLowerCase();
  if (text.includes("ask") || text.includes("faq") || text.includes("what can")) return "ASK US";
  if (text.includes("pickup")) return "BOOK PICKUP";
  if (text.includes("message") || text.includes("messenger")) return "MESSAGE US";
  if (text.includes("book")) return "BOOK NOW";
  return "LEARN MORE";
}

function getFormatLabel(visualDirection: string) {
  const text = visualDirection.toLowerCase();
  if (text.includes("faq")) return "FAQ";
  if (text.includes("checklist")) return "CHECKLIST";
  if (text.includes("service")) return "SERVICE";
  if (text.includes("proof")) return "PROOF";
  return "POST";
}

function normalizeHex(color?: string) {
  if (!color) return undefined;
  const trimmed = color.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  return undefined;
}

function wrapText(text: string, maxChars: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:!?]$/, "")}…`;
  }
  return lines;
}

function abbreviate(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "OR";
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
