import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  findUnique: vi.fn(),
  delete: vi.fn(),
  findFirst: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    brand: mocks
  }
}));

import { DELETE as deleteBrand } from "@/app/api/brands/[brandId]/route";

describe("DELETE /api/brands/:brandId", () => {
  it("blocks deleting the last brand", async () => {
    mocks.count.mockResolvedValue(1);

    const response = await deleteBrand(new Request("http://127.0.0.1:3001/api/brands/brand-one"), {
      params: Promise.resolve({ brandId: "brand-one" })
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("You need at least one brand in the workspace.");
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("deletes a brand and returns the next brand to show", async () => {
    mocks.count.mockResolvedValue(2);
    mocks.findUnique.mockResolvedValue({ id: "brand-one", name: "Brand One" });
    mocks.delete.mockResolvedValue({ id: "brand-one" });
    mocks.findFirst.mockResolvedValue({ id: "brand-two" });

    const response = await deleteBrand(new Request("http://127.0.0.1:3001/api/brands/brand-one"), {
      params: Promise.resolve({ brandId: "brand-one" })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: "brand-one" } });
    expect(payload).toEqual({
      deletedBrand: { id: "brand-one", name: "Brand One" },
      nextBrandId: "brand-two"
    });
  });
});
