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

type CampaignAngle = "booking" | "offer" | "launch" | "event" | "local" | "guide" | "general";
type CreativeCategory = "laundry" | "food" | "property" | "beauty" | "service" | "retail";

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
  const proofY = isLandscape ? height - 318 : height - 286;
  const proofBoxHeight = isLandscape ? 146 : 132;
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
  const angle = getCampaignAngle(input);
  const marketingLabel = getMarketingLabel(input);
  const offerBadge = getOfferBadge(input);
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
  const photoCopyBoxX = pad;
  const photoBadgeWidth = Math.min(520, Math.max(278, offerBadge.length * 13 + 92));
  const fallbackBadgeWidth = Math.min(width - pad * 2 - 112, Math.max(330, offerBadge.length * 14 + 120));
  const actionStripY = height - pad - 92;
  const proofLines = limitLines(wrapText(proofLine, isLandscape ? 40 : 34), 2, isLandscape ? 40 : 34);
  const fallbackSublineLines = limitLines(wrapText(input.subline, width >= 1200 ? 36 : 31), 2, width >= 1200 ? 36 : 31);
  const fallbackHeroX = pad + 48;
  const fallbackHeroY = pad + 150;
  const fallbackHeroWidth = width - pad * 2 - 96;
  const fallbackHeroHeight = isLandscape ? Math.round(height * 0.42) : Math.round(height * 0.34);
  const fallbackCopyY = fallbackHeroY + fallbackHeroHeight + 54;
  const fallbackAdHeadlineSize = isLandscape ? 46 : headlineLines.length > 2 ? 52 : 62;
  const fallbackAdHeadlineStep = Math.round(fallbackAdHeadlineSize * 1.1);
  const fallbackAdSublineSize = isLandscape ? 24 : 30;
  const fallbackAdSublineStep = Math.round(fallbackAdSublineSize * 1.32);
  const fallbackAdSublineY = fallbackCopyY + 88 + estimateTextHeight(fallbackAdHeadlineSize, fallbackAdHeadlineStep, headlineLines.length) + 34;

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
      <stop offset="32%" stop-color="${brandColor}" stop-opacity="0.16"/>
      <stop offset="76%" stop-color="${brandColor}" stop-opacity="0.84"/>
      <stop offset="100%" stop-color="${brandColor}" stop-opacity="0.98"/>
    </linearGradient>
    <filter id="logoLift" x="-30%" y="-40%" width="160%" height="180%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${brandColor}" flood-opacity="0.72"/>
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="${brandColor}" flood-opacity="0.28"/>
    </filter>
    <filter id="textLift" x="-12%" y="-14%" width="124%" height="136%">
      <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="${brandColor}" flood-opacity="0.42"/>
    </filter>
  </defs>
  <image href="${escapeXml(input.backgroundImage)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${width}" height="${height}" fill="url(#brandWash)"/>
  <rect x="0" y="${Math.round(height * 0.28)}" width="${width}" height="${Math.round(height * 0.72)}" fill="url(#copyShade)"/>
  <polygon points="0,${Math.round(height * 0.70)} ${width},${Math.round(height * 0.61)} ${width},${height} 0,${height}" fill="${brandColor}" fill-opacity="0.90"/>
  <rect x="0" y="${height - 18}" width="${width}" height="18" fill="${accentColor}"/>
  ${input.logoImage ? `<image href="${escapeXml(input.logoImage)}" x="${pad + 8}" y="${pad + 8}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMinYMid meet" filter="url(#logoLift)"/>` : `<text x="${pad + 8}" y="${pad + 54}" fill="${brandColor}" filter="url(#logoLift)" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="900">${escapeXml(input.brandName)}</text>`}
  <rect x="${photoCopyBoxX}" y="${photoPanelY}" width="${photoBadgeWidth}" height="58" rx="8" fill="${accentColor}"/>
  <text x="${photoCopyBoxX + 28}" y="${photoPanelY + 38}" fill="${ctaInk}" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" letter-spacing="2.4">${escapeXml(offerBadge.toUpperCase())}</text>
  <text x="${photoCopyBoxX}" y="${photoPanelY + 100}" fill="${headerInk}" filter="url(#textLift)" font-family="Arial, Helvetica, sans-serif" font-size="${photoHeadlineSize + (isLandscape ? 8 : 12)}" font-weight="900" letter-spacing="-2.2">
${headlineLines.map((line, index) => `    <tspan x="${photoCopyBoxX}" dy="${index === 0 ? 0 : photoHeadlineStep + (isLandscape ? 8 : 12)}">${escapeXml(line)}</tspan>`).join("\n")}
  </text>
  <text x="${photoCopyBoxX}" y="${photoSublineY + 42}" fill="${headerInk}" fill-opacity="0.94" font-family="Arial, Helvetica, sans-serif" font-size="${photoSublineSize}" font-weight="700">
${sublineLines.map((line, index) => `    <tspan x="${photoCopyBoxX}" dy="${index === 0 ? 0 : photoSublineStep}">${escapeXml(line)}</tspan>`).join("\n")}
  </text>
  <line x1="${pad}" y1="${actionStripY - 26}" x2="${width - pad}" y2="${actionStripY - 26}" stroke="${headerInk}" stroke-opacity="0.32" stroke-width="2"/>
  <text x="${pad}" y="${actionStripY + 28}" fill="${headerInk}" fill-opacity="0.88" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" letter-spacing="1.8">${escapeXml(marketingLabel)}</text>
  <text x="${pad}" y="${actionStripY + 62}" fill="${headerInk}" fill-opacity="0.76" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700">${escapeXml(host)}</text>
  <rect x="${width - pad - ctaWidth}" y="${actionStripY}" width="${ctaWidth}" height="72" rx="10" fill="${accentColor}"/>
  <text x="${width - pad - ctaWidth / 2}" y="${actionStripY + 47}" text-anchor="middle" fill="${ctaInk}" font-family="Arial, Helvetica, sans-serif" font-size="${cta.length > 12 ? 17 : 20}" font-weight="900" letter-spacing="1.6">${escapeXml(cta)}</text>
</svg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(input.headline)}">
  <defs>
    <linearGradient id="brandBackdrop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${brandColor}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.16"/>
    </linearGradient>
    <linearGradient id="posterPaper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffefa"/>
      <stop offset="100%" stop-color="#f0eadf"/>
    </linearGradient>
    <linearGradient id="posterBand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${brandColor}" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="${brandColor}" stop-opacity="0.82"/>
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
  <rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="${height - pad * 2}" rx="18" fill="url(#posterPaper)" filter="url(#fallbackShadow)"/>
  <rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="104" rx="18" fill="url(#posterBand)"/>
  <rect x="${pad}" y="${pad + 84}" width="${width - pad * 2}" height="20" fill="url(#posterBand)"/>
  <rect x="${pad}" y="${height - pad - 18}" width="${width - pad * 2}" height="18" fill="${accentColor}"/>
  ${input.logoImage ? `<image href="${escapeXml(input.logoImage)}" x="${pad + 36}" y="${pad + 18}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMinYMid meet" filter="url(#fallbackLogoLift)"/>` : `<text x="${pad + 36}" y="${pad + 66}" fill="${headerInk}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900">${escapeXml(input.brandName)}</text>`}
  <text x="${width - pad - 42}" y="${pad + 63}" text-anchor="end" fill="${headerInk}" fill-opacity="0.84" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" letter-spacing="2.4">${escapeXml(marketingLabel)}</text>
  ${renderFallbackHero({
    x: fallbackHeroX,
    y: fallbackHeroY,
    width: fallbackHeroWidth,
    height: fallbackHeroHeight,
    brandColor,
    accentColor,
    ink: headerInk,
    category: getCreativeCategory(input),
    angle
  })}
  <rect x="${pad + 48}" y="${fallbackCopyY}" width="${fallbackBadgeWidth}" height="58" rx="8" fill="${accentColor}"/>
  <text x="${pad + 76}" y="${fallbackCopyY + 38}" fill="${ctaInk}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" letter-spacing="2.1">${escapeXml(offerBadge.toUpperCase())}</text>
  <text x="${pad + 48}" y="${fallbackCopyY + 126}" fill="${brandColor}" font-family="Arial, Helvetica, sans-serif" font-size="${fallbackAdHeadlineSize}" font-weight="900" letter-spacing="-1.8">
${headlineLines.map((line, index) => `    <tspan x="${pad + 48}" dy="${index === 0 ? 0 : fallbackAdHeadlineStep}">${escapeXml(line)}</tspan>`).join("\n")}
  </text>
  <text x="${pad + 48}" y="${fallbackAdSublineY}" fill="${brandColor}" fill-opacity="0.84" font-family="Arial, Helvetica, sans-serif" font-size="${fallbackAdSublineSize}" font-weight="700">
${fallbackSublineLines.map((line, index) => `    <tspan x="${pad + 48}" dy="${index === 0 ? 0 : fallbackAdSublineStep}">${escapeXml(line)}</tspan>`).join("\n")}
  </text>
  <rect x="${pad + 48}" y="${proofY - 22}" width="${width - pad * 2 - 96}" height="${proofBoxHeight}" rx="14" fill="${brandColor}" fill-opacity="0.94"/>
  <rect x="${pad + 48}" y="${proofY - 22}" width="16" height="${proofBoxHeight}" rx="8" fill="${accentColor}"/>
  <text x="${pad + 92}" y="${proofY + 44}" fill="${headerInk}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900">
${proofLines.map((line, index) => `    <tspan x="${pad + 92}" dy="${index === 0 ? 0 : 36}">${escapeXml(line)}</tspan>`).join("\n")}
  </text>
  <rect x="${pad + 48}" y="${ctaY}" width="${ctaWidth}" height="70" rx="10" fill="${accentColor}"/>
  <text x="${pad + 48 + ctaWidth / 2}" y="${ctaY + 45}" text-anchor="middle" fill="${ctaInk}" font-family="Arial, Helvetica, sans-serif" font-size="${cta.length > 12 ? 17 : 20}" font-weight="900" letter-spacing="2">${escapeXml(cta)}</text>
  <text x="${width - pad - 48}" y="${ctaY + 44}" text-anchor="end" fill="${brandColor}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" letter-spacing="1.5">${escapeXml(host.toUpperCase())}</text>
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

function getCampaignAngle(input: ArtCardInput): CampaignAngle {
  const text = `${input.headline} ${input.subline} ${input.marketingGoal ?? ""} ${input.offerContext ?? ""}`.toLowerCase();
  if (text.includes("message") || text.includes("book") || text.includes("pickup") || text.includes("appointment") || text.includes("schedule")) return "booking";
  if (text.includes("discount") || text.includes("off") || text.includes("free") || text.includes("promo") || text.includes("limited") || text.includes("deal")) return "offer";
  if (text.includes("new") || text.includes("launch") || text.includes("now available") || text.includes("introducing")) return "launch";
  if (text.includes("event") || text.includes("join") || text.includes("open house") || text.includes("workshop")) return "event";
  if (text.includes("visit") || text.includes("nearby") || text.includes("store") || text.includes("location")) return "local";
  if (text.includes("tip") || text.includes("guide") || text.includes("learn") || text.includes("how to")) return "guide";
  return "general";
}

function getMarketingLabel(input: ArtCardInput) {
  const text = `${input.marketingGoal ?? ""} ${input.offerContext ?? ""}`.toLowerCase();
  if (text.includes("book") || text.includes("appointment") || text.includes("pickup") || text.includes("schedule")) return "BOOKING OPEN";
  if (text.includes("new") || text.includes("launch")) return "NOW AVAILABLE";
  if (text.includes("discount") || text.includes("off") || text.includes("free") || text.includes("limited") || text.includes("until") || text.includes("this week")) return "LIMITED OFFER";
  if (text.includes("event") || text.includes("join")) return "YOU'RE INVITED";
  if (text.includes("tip") || text.includes("guide") || text.includes("learn")) return "GOOD TO KNOW";
  return input.eyebrow.replaceAll("_", " ").toUpperCase();
}

function getOfferBadge(input: ArtCardInput) {
  const combined = `${input.headline} ${input.subline} ${input.marketingGoal ?? ""} ${input.offerContext ?? ""}`.toLowerCase();
  if ((combined.includes("messenger") || combined.includes("message") || combined.includes("chat")) && combined.includes("book")) return "Messenger booking";
  if (combined.includes("pickup")) return "Pickup available";
  if (combined.includes("appointment") || combined.includes("schedule")) return "Appointments open";
  if (combined.includes("discount") || combined.includes(" off") || combined.includes("free") || combined.includes("promo")) return "Limited offer";
  if (combined.includes("new") || combined.includes("launch") || combined.includes("now available")) return "Now available";
  if (combined.includes("open house") || combined.includes("property") || combined.includes("condo")) return "Property inquiries";

  const explicit = extractOfferPhrase(input.offerContext ?? "");
  if (explicit) return explicit;

  const headlineOffer = extractOfferPhrase(`${input.headline}. ${input.subline}`);
  if (headlineOffer) return headlineOffer;

  const label = getMarketingLabel(input);
  return label === input.eyebrow.replaceAll("_", " ").toUpperCase() ? "READY WHEN YOU ARE" : label;
}

function extractOfferPhrase(value: string) {
  const candidates = value
    .split(/[.\n;|]/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const selected =
    candidates.find((part) => /(\d+|%|₱|\$|off|free|until|today|week|new|book|pickup|visit|launch|open)/i.test(part)) ??
    candidates[0];

  if (!selected) return "";
  return trimCharacters(selected, 34);
}

function getArtCardProofLine(input: ArtCardInput) {
  const text = `${input.headline} ${input.subline} ${input.visualDirection} ${input.offerContext ?? ""}`.toLowerCase();
  if (text.includes("laundry") || text.includes("dry clean") || text.includes("garment")) {
    return "Pickup, care, and delivery in one simple flow.";
  }
  if (text.includes("food") || text.includes("restaurant") || text.includes("menu")) {
    return "Fresh, easy, and ready for the next order.";
  }
  if (text.includes("property") || text.includes("condo") || text.includes("home") || text.includes("real estate")) {
    return "Clear property details for serious local inquiries.";
  }
  if (text.includes("service") || text.includes("schedule") || text.includes("appointment")) {
    return "Fast service with a clear next step.";
  }
  return "A clear offer with one easy next step.";
}

function getCreativeCategory(input: ArtCardInput): CreativeCategory {
  const text = `${input.brandName} ${input.headline} ${input.subline} ${input.visualDirection} ${input.offerContext ?? ""}`.toLowerCase();
  if (text.includes("laundry") || text.includes("wash") || text.includes("fold") || text.includes("garment")) return "laundry";
  if (text.includes("food") || text.includes("restaurant") || text.includes("menu") || text.includes("coffee") || text.includes("drink")) return "food";
  if (text.includes("property") || text.includes("condo") || text.includes("home") || text.includes("real estate")) return "property";
  if (text.includes("salon") || text.includes("spa") || text.includes("beauty") || text.includes("skin")) return "beauty";
  if (text.includes("shop") || text.includes("store") || text.includes("product") || text.includes("sale")) return "retail";
  return "service";
}

function renderFallbackHero(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  brandColor: string;
  accentColor: string;
  ink: string;
  category: CreativeCategory;
  angle: CampaignAngle;
}) {
  const { x, y, width, height, brandColor, accentColor, ink, category, angle } = input;
  const stageInk = readableTextColor(brandColor);
  const tag = getHeroTag(category, angle);
  const visual = renderCategoryVisual({ x, y, width, height, brandColor, accentColor, ink: stageInk, category });

  return `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="24" fill="${brandColor}"/>
  <path d="M ${x} ${y + height * 0.72} C ${x + width * 0.28} ${y + height * 0.58}, ${x + width * 0.62} ${y + height * 0.88}, ${x + width} ${y + height * 0.64} L ${x + width} ${y + height} L ${x} ${y + height} Z" fill="${accentColor}" fill-opacity="0.95"/>
  <rect x="${x + 28}" y="${y + 28}" width="${Math.min(260, width - 56)}" height="48" rx="7" fill="#fffefa" fill-opacity="0.94"/>
  <text x="${x + 48}" y="${y + 59}" fill="${brandColor}" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="2">${escapeXml(tag)}</text>
  ${visual}
  <rect x="${x + width - 210}" y="${y + height - 78}" width="162" height="42" rx="7" fill="#fffefa" fill-opacity="0.92"/>
  <text x="${x + width - 129}" y="${y + height - 51}" text-anchor="middle" fill="${brandColor}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="900" letter-spacing="1.8">TAP TO ACT</text>`;
}

function getHeroTag(category: CreativeCategory, angle: CampaignAngle) {
  if (angle === "offer") return "OFFER";
  if (angle === "booking") return "BOOKING";
  if (category === "property") return "INQUIRY";
  if (category === "food") return "ORDER";
  if (category === "retail") return "SHOP";
  return "SERVICE";
}

function renderCategoryVisual(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  brandColor: string;
  accentColor: string;
  ink: string;
  category: CreativeCategory;
}) {
  const { x, y, width, height, brandColor, accentColor, ink, category } = input;
  const cx = x + width * 0.52;
  const cy = y + height * 0.52;

  if (category === "laundry") {
    return `
  <rect x="${cx - 210}" y="${cy - 48}" width="330" height="178" rx="26" fill="#fffefa"/>
  <rect x="${cx - 176}" y="${cy - 104}" width="274" height="78" rx="18" fill="${accentColor}"/>
  <rect x="${cx - 136}" y="${cy - 82}" width="194" height="20" rx="10" fill="${brandColor}" fill-opacity="0.26"/>
  <rect x="${cx - 150}" y="${cy - 22}" width="250" height="34" rx="17" fill="${brandColor}" fill-opacity="0.18"/>
  <rect x="${cx - 150}" y="${cy + 30}" width="250" height="34" rx="17" fill="${brandColor}" fill-opacity="0.28"/>
  <rect x="${cx - 150}" y="${cy + 82}" width="250" height="34" rx="17" fill="${brandColor}" fill-opacity="0.38"/>
  <path d="M ${cx + 108} ${cy - 78} L ${cx + 248} ${cy - 38} L ${cx + 214} ${cy + 130} L ${cx + 74} ${cy + 90} Z" fill="${ink}" fill-opacity="0.96"/>
  <path d="M ${cx + 126} ${cy - 42} Q ${cx + 170} ${cy - 86} ${cx + 220} ${cy - 28}" fill="none" stroke="${accentColor}" stroke-width="12" stroke-linecap="round"/>`;
  }

  if (category === "food") {
    return `
  <ellipse cx="${cx - 30}" cy="${cy + 18}" rx="192" ry="118" fill="#fffefa"/>
  <ellipse cx="${cx - 30}" cy="${cy + 18}" rx="132" ry="74" fill="${accentColor}" fill-opacity="0.92"/>
  <path d="M ${cx - 142} ${cy + 100} C ${cx - 92} ${cy + 140}, ${cx + 82} ${cy + 140}, ${cx + 134} ${cy + 98}" fill="${brandColor}" fill-opacity="0.20"/>
  <rect x="${cx + 180}" y="${cy - 116}" width="92" height="226" rx="24" fill="#fffefa"/>
  <rect x="${cx + 202}" y="${cy - 86}" width="48" height="136" rx="18" fill="${brandColor}" fill-opacity="0.22"/>`;
  }

  if (category === "property") {
    return `
  <rect x="${cx - 234}" y="${cy - 116}" width="374" height="246" rx="24" fill="#fffefa"/>
  <path d="M ${cx - 208} ${cy - 20} L ${cx - 46} ${cy - 132} L ${cx + 118} ${cy - 20} Z" fill="${accentColor}"/>
  <rect x="${cx - 168}" y="${cy - 20}" width="244" height="136" rx="12" fill="${brandColor}" fill-opacity="0.90"/>
  <rect x="${cx - 132}" y="${cy + 18}" width="54" height="98" rx="8" fill="#fffefa" fill-opacity="0.90"/>
  <rect x="${cx - 48}" y="${cy + 18}" width="76" height="48" rx="8" fill="#fffefa" fill-opacity="0.86"/>
  <path d="M ${cx + 112} ${cy + 122} L ${cx + 248} ${cy + 80} L ${cx + 256} ${cy + 132} Z" fill="${accentColor}" fill-opacity="0.92"/>`;
  }

  if (category === "beauty") {
    return `
  <rect x="${cx - 180}" y="${cy - 112}" width="148" height="264" rx="38" fill="#fffefa"/>
  <rect x="${cx - 146}" y="${cy - 70}" width="80" height="154" rx="30" fill="${accentColor}"/>
  <path d="M ${cx + 2} ${cy - 106} C ${cx + 108} ${cy - 150}, ${cx + 188} ${cy - 78}, ${cx + 162} ${cy + 24} C ${cx + 138} ${cy + 118}, ${cx + 24} ${cy + 142}, ${cx - 16} ${cy + 52}" fill="#fffefa"/>
  <path d="M ${cx + 38} ${cy - 28} C ${cx + 84} ${cy - 58}, ${cx + 120} ${cy - 40}, ${cx + 138} ${cy + 6}" fill="none" stroke="${brandColor}" stroke-opacity="0.28" stroke-width="16" stroke-linecap="round"/>`;
  }

  if (category === "retail") {
    return `
  <path d="M ${cx - 190} ${cy - 82} L ${cx + 106} ${cy - 132} L ${cx + 184} ${cy + 90} L ${cx - 112} ${cy + 142} Z" fill="#fffefa"/>
  <rect x="${cx - 126}" y="${cy - 42}" width="210" height="140" rx="22" fill="${accentColor}"/>
  <path d="M ${cx - 94} ${cy - 42} Q ${cx - 24} ${cy - 116} ${cx + 50} ${cy - 42}" fill="none" stroke="${brandColor}" stroke-width="13" stroke-linecap="round"/>
  <rect x="${cx + 134}" y="${cy - 116}" width="116" height="188" rx="22" fill="#fffefa" fill-opacity="0.92"/>`;
  }

  return `
  <rect x="${cx - 220}" y="${cy - 96}" width="330" height="210" rx="28" fill="#fffefa"/>
  <rect x="${cx - 178}" y="${cy - 52}" width="246" height="34" rx="17" fill="${brandColor}" fill-opacity="0.20"/>
  <rect x="${cx - 178}" y="${cy + 10}" width="190" height="34" rx="17" fill="${brandColor}" fill-opacity="0.28"/>
  <rect x="${cx - 178}" y="${cy + 72}" width="246" height="34" rx="17" fill="${brandColor}" fill-opacity="0.36"/>
  <path d="M ${cx + 128} ${cy - 128} L ${cx + 252} ${cy - 70} L ${cx + 210} ${cy + 126} L ${cx + 86} ${cy + 70} Z" fill="${accentColor}"/>`;
}

function trimCharacters(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trimEnd()}…` : normalized;
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
