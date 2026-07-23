import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { createRasterArtCard, isUsableRasterImage } from "@/lib/raster-art-card";

describe("raster art cards", () => {
  it("composes a real PNG art card over a photographic image layer", async () => {
    const photo = await sharp({
      create: {
        width: 1080,
        height: 1350,
        channels: 3,
        background: "#8fd7e7"
      }
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 500,
              height: 420,
              channels: 3,
              background: "#f8d44f"
            }
          }).png().toBuffer(),
          left: 430,
          top: 190
        }
      ])
      .png()
      .toBuffer();

    const card = await createRasterArtCard({
      brandName: "The Laundry Project",
      headline: "What Can We Clean?",
      subline: "Clothes, shoes, bedding, bags, linens, and more.",
      visualDirection: "Clean FAQ-style laundry service image.",
      platform: "INSTAGRAM",
      brandColor: "#299CB6",
      accentColor: "#F9CA47",
      websiteHost: "thelaundryproject.ph",
      photo,
      photoContentType: "image/png"
    });

    const metadata = await sharp(card.body).metadata();
    const stats = await sharp(card.body).stats();

    expect(card.contentType).toBe("image/png");
    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1350);
    expect(stats.channels[0].mean).toBeGreaterThan(35);
  });

  it("rejects blank black generated images", async () => {
    const black = await sharp({
      create: {
        width: 1080,
        height: 1350,
        channels: 3,
        background: "#000000"
      }
    }).png().toBuffer();

    await expect(isUsableRasterImage(black)).resolves.toBe(false);
  });
});
