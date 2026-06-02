import { describe, expect, it } from "vitest";
import { GET as connectGoogle } from "@/app/api/integrations/google/connect/route";

describe("GET /api/integrations/google/connect", () => {
  it("returns a setup error when Google OAuth credentials are not configured", async () => {
    const response = await connectGoogle(
      new Request("http://127.0.0.1:3001/api/integrations/google/connect?brandId=demo-brand-luna")
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Google OAuth is not configured.");
  });
});
