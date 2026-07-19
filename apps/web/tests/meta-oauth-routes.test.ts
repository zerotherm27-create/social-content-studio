import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  brandFindUnique: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    brand: {
      findUnique: mocks.brandFindUnique
    }
  }
}));

import { GET as connectMeta } from "@/app/api/integrations/meta/connect/route";
import { POST as importMeta } from "@/app/api/integrations/meta/import/route";

describe("GET /api/integrations/meta/connect", () => {
  it("returns a setup error when Meta OAuth credentials are not configured", async () => {
    vi.stubEnv("META_APP_ID", "");
    vi.stubEnv("META_REDIRECT_URI", "");
    const response = await connectMeta(
      new Request("http://127.0.0.1:3001/api/integrations/meta/connect?brandId=demo-brand-luna")
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Meta OAuth is not configured.");
  });
});

describe("POST /api/integrations/meta/import", () => {
  it("returns a validation error when the request body is empty", async () => {
    const response = await importMeta(new Request("http://127.0.0.1:3001/api/integrations/meta/import", { method: "POST" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Missing brand ID.");
    expect(mocks.brandFindUnique).not.toHaveBeenCalled();
  });
});
