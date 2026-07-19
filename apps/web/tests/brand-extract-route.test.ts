import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  brandFindUnique: vi.fn(),
  brandUpdate: vi.fn(),
  readPublicWebsite: vi.fn(),
  extractBrandProfile: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    brand: {
      findUnique: mocks.brandFindUnique,
      update: mocks.brandUpdate
    }
  }
}));

vi.mock("@/lib/safe-website", () => ({
  readPublicWebsite: mocks.readPublicWebsite
}));

vi.mock("@/lib/agent/brand-profile-agent", () => ({
  extractBrandProfile: mocks.extractBrandProfile
}));

import { POST as extractBrand } from "@/app/api/brands/[brandId]/extract/route";

describe("POST /api/brands/:brandId/extract", () => {
  it("saves the learned Brand DNA to the brand", async () => {
    const profile = {
      voice: "Warm and practical",
      audience: "Busy local households",
      offers: "Laundry pickup and dry cleaning",
      visualStyle: "Clean service visuals",
      bannedPhrases: "best in town"
    };

    mocks.brandFindUnique.mockResolvedValue({ id: "brand-one", name: "Laundry Co" });
    mocks.readPublicWebsite.mockResolvedValue({
      pageTitle: "Laundry Co",
      description: "Pickup laundry service.",
      pageText: "Laundry pickup and delivery."
    });
    mocks.extractBrandProfile.mockResolvedValue(profile);
    mocks.brandUpdate.mockResolvedValue({ id: "brand-one", websiteUrl: "https://laundry.example", ...profile });

    const response = await extractBrand(
      new Request("http://127.0.0.1:3001/api/brands/brand-one/extract", {
        method: "POST",
        body: JSON.stringify({ websiteUrl: "https://laundry.example" })
      }),
      { params: Promise.resolve({ brandId: "brand-one" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.brandUpdate).toHaveBeenCalledWith({
      where: { id: "brand-one" },
      data: {
        ...profile,
        websiteUrl: "https://laundry.example"
      }
    });
    expect(payload.brand).toEqual({ id: "brand-one", websiteUrl: "https://laundry.example", ...profile });
  });
});
