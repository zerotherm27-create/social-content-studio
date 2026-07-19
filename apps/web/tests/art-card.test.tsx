import { describe, expect, it } from "vitest";
import { createArtCard, createArtCardSvg, getArtCardFormat, getArtCardPalette } from "@/lib/art-card";

describe("art cards", () => {
  it("creates a stable 4:5 card composition from brand content", () => {
    const input = {
      brandName: "Example Studio",
      eyebrow: "Education",
      headline: "One useful customer detail",
      subline: "A clear supporting line grounded in the source.",
      visualDirection: "Editorial, warm, and tactile",
      backgroundImage: "data:image/png;base64,AA==",
      logoImage: "data:image/png;base64,AQ==",
      websiteHost: "example.com"
    };

    expect(createArtCard(input).type).toBe("div");
    expect(createArtCard(input).props.children[0].type).toBe("img");
    expect(getArtCardPalette(input.visualDirection)).toEqual(getArtCardPalette(input.visualDirection));
    expect(getArtCardFormat("TIKTOK")).toMatchObject({ width: 1080, height: 1920 });
    expect(getArtCardFormat("GOOGLE_BUSINESS")).toMatchObject({ width: 1200, height: 900 });
  });

  it("creates a standalone SVG image for browser previews", () => {
    const svg = createArtCardSvg({
      brandName: "Example Studio",
      eyebrow: "Education",
      headline: "One useful customer detail",
      subline: "A clear supporting line grounded in the source.",
      visualDirection: "Editorial, warm, and tactile",
      websiteHost: "example.com"
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("One useful");
    expect(svg).toContain("EXAMPLE.COM");
    expect(svg).toContain("BOOK NOW");
    expect((svg.match(/BOOK NOW/g) ?? [])).toHaveLength(1);
    expect(svg).not.toContain("MARKETING CAMPAIGN CARD");
    expect(svg).not.toContain("READY TO POST");
    expect(svg).not.toContain("BRANDED 4:5 SOCIAL CARD");
    expect(svg).not.toContain("#050706");
    expect(svg).not.toContain("#080b09");
    expect(svg).not.toContain("#000000");
    expect(svg).not.toContain("photoShade");
    expect(svg).not.toContain("campaignBg");
    expect(svg).not.toContain("<circle");
    expect(svg).not.toContain("rotate(");
  });

  it("creates a realistic campaign card when a generated photo is available", () => {
    const svg = createArtCardSvg({
      brandName: "Example Studio",
      eyebrow: "Promotion",
      headline: "One useful customer detail",
      subline: "A clear supporting line grounded in the source.",
      visualDirection: "Editorial, warm, and tactile",
      platform: "GOOGLE_BUSINESS",
      backgroundImage: "data:image/jpeg;base64,abc123",
      logoImage: "data:image/png;base64,logo123",
      brandColor: "#1266cc",
      accentColor: "#44aa55",
      websiteHost: "example.com"
    });

    expect(svg).toContain("<image");
    expect(svg).toContain('width="1200" height="900"');
    expect(svg).toContain("data:image/jpeg;base64,abc123");
    expect(svg).toContain("data:image/png;base64,logo123");
    expect(svg).toContain("#1266cc");
    expect(svg).toContain("#44aa55");
    expect(svg).toContain("logoLift");
    expect(svg).toContain("BOOK NOW");
    expect((svg.match(/BOOK NOW/g) ?? [])).toHaveLength(1);
    expect(svg).not.toContain('fill="#ffffff" fill-opacity="0.95"');
    expect(svg).not.toContain('fill="#ffffff" fill-opacity="0.96"');
    expect(svg).not.toContain("REALISTIC CAMPAIGN CARD");
    expect(svg).not.toContain("MARKETING CAMPAIGN CARD");
    expect(svg).not.toContain("#050706");
    expect(svg).not.toContain("#080b09");
    expect(svg).not.toContain("#000000");
    expect(svg).not.toContain("photoShade");
  });

  it("keeps logo treatment clean and prevents long copy from crowding the card", () => {
    const svg = createArtCardSvg({
      brandName: "The Laundry Project",
      eyebrow: "Laundry",
      headline: "Fresh laundry pickup and delivery for busy condo residents who need reliable care",
      subline:
        "Book a pickup today and get clean folded clothes delivered back without confusing steps, overlapping offers, or extra repeated call-to-action text.",
      visualDirection: "Bright realistic laundry shop photography with teal and yellow brand accents",
      platform: "INSTAGRAM",
      backgroundImage: "data:image/jpeg;base64,photo",
      logoImage: "data:image/png;base64,whiteLogo",
      brandColor: "#007ea7",
      accentColor: "#f4c430",
      websiteHost: "thelaundryproject.ph"
    });

    expect(svg).toContain("logoLift");
    expect(svg).not.toContain('fill="#ffffff" fill-opacity="0.95"');
    expect(svg).not.toContain('fill="#ffffff" fill-opacity="0.96"');
    expect((svg.match(/BOOK NOW/g) ?? [])).toHaveLength(1);
    expect((svg.match(/<tspan/g) ?? []).length).toBeLessThanOrEqual(7);
  });
});
