import React, { type ReactElement } from "react";

type ArtCardInput = {
  brandName: string;
  eyebrow: string;
  headline: string;
  subline: string;
  visualDirection: string;
  platform?: string;
  backgroundImage?: string;
  logoImage?: string;
  brandColor?: string;
  accentColor?: string;
  websiteHost?: string;
  marketingGoal?: string;
  offerContext?: string;
};

type ArtCardFormat = {
  platform: string;
  label: string;
  width: number;
  height: number;
};

const palettes = [
  { background: "#17231d", surface: "#dce5d5", accent: "#f06b4f", ink: "#f9f7ef", darkInk: "#17231d" },
  { background: "#251f35", surface: "#e8ddf2", accent: "#f3a738", ink: "#fff9eb", darkInk: "#251f35" },
  { background: "#14313a", surface: "#cde8e6", accent: "#f0785a", ink: "#f5fbf8", darkInk: "#14313a" },
  { background: "#38241e", surface: "#f0ddc6", accent: "#d85b47", ink: "#fff9ef", darkInk: "#38241e" }
];

export function getArtCardPalette(seed: string) {
  return palettes[stableHash(seed) % palettes.length];
}

export function getArtCardFormat(platform?: string): ArtCardFormat {
  switch (platform) {
    case "TIKTOK":
    case "INSTAGRAM_STORY":
      return { platform: platform ?? "TIKTOK", label: "9:16 vertical", width: 1080, height: 1920 };
    case "GOOGLE_BUSINESS":
      return { platform: platform ?? "GOOGLE_BUSINESS", label: "4:3 landscape", width: 1200, height: 900 };
    case "LINKEDIN":
      return { platform: platform ?? "LINKEDIN", label: "4:5 professional", width: 1200, height: 1500 };
    case "THREADS":
      return { platform: platform ?? "THREADS", label: "4:5 conversation", width: 1080, height: 1350 };
    case "FACEBOOK":
    case "INSTAGRAM":
    default:
      return { platform: platform ?? "FACEBOOK", label: "4:5 feed", width: 1080, height: 1350 };
  }
}

export function createArtCard(input: ArtCardInput): ReactElement {
  const palette = getArtCardPalette(`${input.brandName}:${input.visualDirection}`);
  const hasPhoto = Boolean(input.backgroundImage);
  const headlineSize = input.headline.length > 54 ? 64 : input.headline.length > 34 ? 74 : 86;
  const cta = getArtCardCta(input);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        padding: "64px",
        color: palette.ink,
        background: palette.background,
        fontFamily: "Arial, sans-serif"
      }}
    >
      {input.backgroundImage ? (
        <img
          src={input.backgroundImage}
          alt=""
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundImage: hasPhoto
            ? "linear-gradient(180deg, rgba(8,16,20,.20) 0%, rgba(8,16,20,.08) 32%, rgba(8,16,20,.84) 72%, rgba(8,16,20,.98) 100%)"
            : `linear-gradient(145deg, ${palette.background} 0%, ${palette.darkInk} 100%)`
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {input.logoImage ? (
          <img src={input.logoImage} alt={input.brandName} style={{ width: 290, height: 84, objectFit: "contain", objectPosition: "left center" }} />
        ) : (
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: "-0.025em" }}>{input.brandName}</div>
        )}
        <div
          style={{
            display: "flex",
            border: "2px solid rgba(255,255,255,.72)",
            borderRadius: 999,
            padding: "12px 20px",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase"
          }}
        >
          {cta}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "flex-end" }}>
        {!hasPhoto ? (
          <div style={{ display: "flex", maxWidth: 760, marginBottom: 42, color: palette.surface, fontSize: 25, lineHeight: 1.35 }}>
            {input.visualDirection}
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", borderLeft: `12px solid ${palette.accent}`, paddingLeft: 32 }}>
          <div
            style={{
              display: "flex",
              maxWidth: 900,
              fontSize: headlineSize,
              fontWeight: 900,
              letterSpacing: "-0.055em",
              lineHeight: 0.96
            }}
          >
            {input.headline}
          </div>
          <div style={{ display: "flex", maxWidth: 820, marginTop: 28, fontSize: 31, lineHeight: 1.25, opacity: 0.92 }}>
            {input.subline}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 58,
          borderTop: "2px solid rgba(255,255,255,.46)",
          paddingTop: 24,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase"
        }}
      >
        <span>{input.websiteHost || "Brand-led creative"}</span>
        <span>{cta}</span>
      </div>
    </div>
  );
}

export function createArtCardSvg(input: ArtCardInput) {
  const palette = getArtCardPalette(`${input.brandName}:${input.visualDirection}`);
  const format = getArtCardFormat(input.platform);
  const { width, height } = format;
  const isLandscape = width > height;
  const pad = width >= 1200 ? 72 : 64;
  const logoWidth = input.logoImage ? 260 : Math.min(442, width - pad * 2);
  const logoHeight = input.logoImage ? 72 : 84;
  const panelWidth = width - pad * 2;
  const fallbackCardY = Math.round(height * 0.19);
  const proofY = height - 338;
  const ctaY = height - 144;
  const brandColor = input.brandColor || palette.background;
  const accentColor = input.accentColor || palette.accent;
  const headerInk = readableTextColor(brandColor);
  const headlineLines = limitLines(wrapText(input.headline, width >= 1200 ? 24 : 20), isLandscape ? 3 : 4, width >= 1200 ? 24 : 20);
  const sublineLines = limitLines(wrapText(input.subline, width >= 1200 ? 44 : 38), isLandscape ? 2 : 3, width >= 1200 ? 44 : 38);
  const host = input.websiteHost || "Brand-led creative";
  const cta = getArtCardCta(input);
  const ctaInk = readableTextColor(accentColor);
  const ctaWidth = cta.length > 12 ? 354 : 230;
  const proofLine = getArtCardProofLine(input);
  const marketingLabel = getMarketingLabel(input);
  const photoHeadlineSize = isLandscape
    ? (headlineLines.length > 2 ? 44 : 56)
    : width >= 1200 ? (headlineLines.length > 2 ? 62 : 74) : (headlineLines.length > 2 ? 58 : 70);
  const photoHeadlineStep = headlineLines.length > 2 ? Math.round(photoHeadlineSize * 1.14) : Math.round(photoHeadlineSize * 1.12);
  const photoSublineSize = isLandscape ? 25 : 30;
  const photoSublineStep = Math.round(photoSublineSize * 1.34);
  const photoTextHeight =
    estimateTextHeight(photoHeadlineSize, photoHeadlineStep, headlineLines.length) +
    42 +
    estimateTextHeight(photoSublineSize, photoSublineStep, sublineLines.length);
  const photoPanelHeight = Math.min(
    Math.max(Math.round(height * 0.34), photoTextHeight + 238, 430),
    height >= 1800 ? 760 : Math.round(height * 0.54)
  );
  const photoPanelY = height - photoPanelHeight - pad;
  const photoHeadlineY = photoPanelY + 104;
  const photoSublineY = photoHeadlineY + estimateTextHeight(photoHeadlineSize, photoHeadlineStep, headlineLines.length) + 42;
  const fallbackHeadlineSize = isLandscape
    ? (headlineLines.length > 2 ? 48 : 62)
    : width >= 1200 ? (headlineLines.length > 2 ? 66 : 82) : (headlineLines.length > 2 ? 62 : 76);
  const fallbackHeadlineStep = headlineLines.length > 2 ? Math.round(fallbackHeadlineSize * 1.14) : Math.round(fallbackHeadlineSize * 1.12);
  const fallbackSublineSize = isLandscape ? 27 : 32;
  const fallbackSublineStep = Math.round(fallbackSublineSize * 1.32);
  const fallbackTextHeight =
    estimateTextHeight(fallbackHeadlineSize, fallbackHeadlineStep, headlineLines.length) +
    48 +
    estimateTextHeight(fallbackSublineSize, fallbackSublineStep, sublineLines.length);
  const fallbackCardHeight = Math.min(
    Math.max(Math.round(height * 0.52), fallbackTextHeight + 272, 560),
    proofY - fallbackCardY - 34
  );
  const fallbackHeadlineY = fallbackCardY + 186;
  const fallbackSublineY = fallbackHeadlineY + estimateTextHeight(fallbackHeadlineSize, fallbackHeadlineStep, headlineLines.length) + 48;

  if (input.backgroundImage) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(input.headline)}">
  <defs>
    <linearGradient id="brandWash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${brandColor}" stop-opacity="0.08"/>
      <stop offset="48%" stop-color="${brandColor}" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="${brandColor}" stop-opacity="0.34"/>
    </linearGradient>
    <linearGradient id="copyShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${brandColor}" stop-opacity="0"/>
      <stop offset="36%" stop-color="${brandColor}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${brandColor}" stop-opacity="0.98"/>
    </linearGradient>
    <filter id="logoLift" x="-30%" y="-40%" width="160%" height="180%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${brandColor}" flood-opacity="0.72"/>
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="${brandColor}" flood-opacity="0.28"/>
    </filter>
  </defs>
  <image href="${escapeXml(input.backgroundImage)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${width}" height="${height}" fill="url(#brandWash)"/>
  <rect x="0" y="${Math.round(height * 0.35)}" width="${width}" height="${Math.round(height * 0.65)}" fill="url(#copyShade)"/>
  ${input.logoImage ? `<image href="${escapeXml(input.logoImage)}" x="${pad + 8}" y="${pad + 8}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMinYMid meet" filter="url(#logoLift)"/>` : `<text x="${pad + 8}" y="${pad + 54}" fill="${brandColor}" filter="url(#logoLift)" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="900">${escapeXml(input.brandName)}</text>`}
  <rect x="${pad}" y="${photoPanelY + 18}" width="12" height="42" rx="6" fill="${accentColor}"/>
  <text x="${pad + 28}" y="${photoPanelY + 50}" fill="${headerInk}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" letter-spacing="3">${escapeXml(marketingLabel)}</text>
  <text x="${pad}" y="${photoHeadlineY + 12}" fill="${headerInk}" font-family="Arial, Helvetica, sans-serif" font-size="${photoHeadlineSize + (isLandscape ? 4 : 8)}" font-weight="900" letter-spacing="-2">
${headlineLines.map((line, index) => `    <tspan x="${pad}" dy="${index === 0 ? 0 : photoHeadlineStep + (isLandscape ? 4 : 8)}">${escapeXml(line)}</tspan>`).join("\n")}
  </text>
  <text x="${pad}" y="${photoSublineY + 24}" fill="${headerInk}" fill-opacity="0.92" font-family="Arial, Helvetica, sans-serif" font-size="${photoSublineSize}" font-weight="600">
${sublineLines.map((line, index) => `    <tspan x="${pad}" dy="${index === 0 ? 0 : photoSublineStep}">${escapeXml(line)}</tspan>`).join("\n")}
  </text>
  <line x1="${pad}" y1="${height - pad - 86}" x2="${width - pad}" y2="${height - pad - 86}" stroke="${headerInk}" stroke-opacity="0.38" stroke-width="2"/>
  <text x="${pad}" y="${height - pad - 34}" fill="${headerInk}" fill-opacity="0.86" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="800" letter-spacing="1.5">${escapeXml(host.toUpperCase())}</text>
  <rect x="${width - pad - ctaWidth}" y="${height - pad - 68}" width="${ctaWidth}" height="68" rx="12" fill="${accentColor}"/>
  <text x="${width - pad - ctaWidth / 2}" y="${height - pad - 24}" text-anchor="middle" fill="${ctaInk}" font-family="Arial, Helvetica, sans-serif" font-size="${cta.length > 12 ? 17 : 20}" font-weight="900" letter-spacing="1.6">${escapeXml(cta)}</text>
</svg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(input.headline)}">
  <defs>
    <linearGradient id="brandBackdrop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${brandColor}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.16"/>
    </linearGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffefa"/>
      <stop offset="100%" stop-color="#efece3"/>
    </linearGradient>
    <filter id="fallbackShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="26" stdDeviation="28" flood-color="${brandColor}" flood-opacity="0.18"/>
    </filter>
    <filter id="fallbackLogoLift" x="-30%" y="-40%" width="160%" height="180%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${brandColor}" flood-opacity="0.72"/>
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="${brandColor}" flood-opacity="0.26"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#brandBackdrop)"/>
  <rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="${height - pad * 2}" rx="44" fill="${brandColor}" fill-opacity="0.08" stroke="${brandColor}" stroke-opacity="0.30" stroke-width="2"/>
  ${input.logoImage ? `<image href="${escapeXml(input.logoImage)}" x="${pad + 8}" y="${pad + 24}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMinYMid meet" filter="url(#fallbackLogoLift)"/>` : `<text x="${pad + 8}" y="${pad + 70}" fill="${brandColor}" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="900">${escapeXml(input.brandName)}</text>`}
  <rect x="${pad + 8}" y="${fallbackCardY}" width="${width - (pad + 8) * 2}" height="${fallbackCardHeight}" rx="42" fill="url(#paper)" filter="url(#fallbackShadow)"/>
  <rect x="${pad + 8}" y="${fallbackCardY}" width="${width - (pad + 8) * 2}" height="24" rx="12" fill="${accentColor}"/>
  <text x="${pad + 56}" y="${fallbackCardY + 96}" fill="${brandColor}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" letter-spacing="3">${escapeXml(host.toUpperCase())}</text>
  <rect x="${pad + 56}" y="${fallbackCardY + 140}" width="12" height="${Math.min(318, fallbackCardHeight - 230)}" rx="6" fill="${accentColor}"/>
  <text x="${pad + 96}" y="${fallbackHeadlineY}" fill="${brandColor}" font-family="Arial, Helvetica, sans-serif" font-size="${fallbackHeadlineSize}" font-weight="900" letter-spacing="-2">
${headlineLines.map((line, index) => `    <tspan x="${pad + 96}" dy="${index === 0 ? 0 : fallbackHeadlineStep}">${escapeXml(line)}</tspan>`).join("\n")}
  </text>
  <text x="${pad + 96}" y="${fallbackSublineY}" fill="${brandColor}" fill-opacity="0.82" font-family="Arial, Helvetica, sans-serif" font-size="${fallbackSublineSize}" font-weight="600">
${sublineLines.map((line, index) => `    <tspan x="${pad + 96}" dy="${index === 0 ? 0 : fallbackSublineStep}">${escapeXml(line)}</tspan>`).join("\n")}
  </text>
  <rect x="${pad + 8}" y="${proofY}" width="${width - (pad + 8) * 2}" height="166" rx="34" fill="${brandColor}" fill-opacity="0.92"/>
  <text x="${pad + 56}" y="${proofY + 68}" fill="${headerInk}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800">${escapeXml(proofLine)}</text>
  <rect x="${pad + 56}" y="${ctaY}" width="${ctaWidth}" height="70" rx="35" fill="${accentColor}"/>
  <text x="${pad + 56 + ctaWidth / 2}" y="${ctaY + 45}" text-anchor="middle" fill="${ctaInk}" font-family="Arial, Helvetica, sans-serif" font-size="${cta.length > 12 ? 17 : 20}" font-weight="900" letter-spacing="2">${escapeXml(cta)}</text>
</svg>`;
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function wrapText(value: string, maxLength: number) {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLength) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [value.slice(0, maxLength)];
}

function limitLines(lines: string[], maxLines: number, maxLength: number) {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const lastIndex = kept.length - 1;
  const suffix = "…";
  kept[lastIndex] = `${kept[lastIndex].slice(0, Math.max(0, maxLength - suffix.length)).trimEnd()}${suffix}`;
  return kept;
}

function estimateTextHeight(fontSize: number, lineStep: number, lineCount: number) {
  if (lineCount <= 0) return 0;
  return fontSize + Math.max(0, lineCount - 1) * lineStep;
}

function getArtCardCta(input: ArtCardInput) {
  const text = `${input.headline} ${input.subline} ${input.visualDirection} ${input.marketingGoal ?? ""} ${input.offerContext ?? ""}`.toLowerCase();
  if (text.includes("message") || text.includes("messenger") || text.includes("chat")) return "MESSAGE US TO BOOK";
  if (text.includes("book") || text.includes("schedule") || text.includes("appointment") || text.includes("pickup")) return "BOOK NOW";
  if (text.includes("order") || text.includes("shop") || text.includes("buy")) return "ORDER NOW";
  if (text.includes("visit") || text.includes("drop by") || text.includes("in-store")) return "VISIT US";
  if (text.includes("learn") || text.includes("guide") || text.includes("discover")) return "LEARN MORE";
  if (text.includes("reserve")) return "RESERVE NOW";
  return "BOOK NOW";
}

function getMarketingLabel(input: ArtCardInput) {
  const text = `${input.marketingGoal ?? ""} ${input.offerContext ?? ""}`.toLowerCase();
  if (text.includes("new") || text.includes("launch")) return "NOW AVAILABLE";
  if (text.includes("limited") || text.includes("until") || text.includes("this week")) return "LIMITED OFFER";
  if (text.includes("event") || text.includes("join")) return "YOU'RE INVITED";
  if (text.includes("tip") || text.includes("guide") || text.includes("learn")) return "GOOD TO KNOW";
  return input.eyebrow.replaceAll("_", " ").toUpperCase();
}

function getArtCardProofLine(input: ArtCardInput) {
  const text = `${input.headline} ${input.subline} ${input.visualDirection}`.toLowerCase();
  if (text.includes("laundry") || text.includes("dry clean") || text.includes("garment")) {
    return "Pickup, care, and delivery made simple.";
  }
  if (text.includes("food") || text.includes("restaurant") || text.includes("menu")) {
    return "Fresh, easy, and ready when you are.";
  }
  if (text.includes("service") || text.includes("schedule") || text.includes("appointment")) {
    return "Fast service with a clear next step.";
  }
  return "A clear offer with one easy next step.";
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readableTextColor(background: string) {
  const normalized = background.match(/^#[0-9a-f]{6}$/i)?.[0] ?? "#17231d";
  const [r, g, b] = [normalized.slice(1, 3), normalized.slice(3, 5), normalized.slice(5, 7)].map((part) => Number.parseInt(part, 16));
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.58 ? "#17231d" : "#fff9ef";
}
