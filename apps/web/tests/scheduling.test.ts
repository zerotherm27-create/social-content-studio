import { describe, expect, it } from "vitest";
import { Platform } from "@/lib/domain";
import { nextBestDailyPublishAt, parseManilaSpecificTime } from "@/lib/scheduling";

describe("daily scheduling", () => {
  it("schedules Facebook at the next best Manila evening slot", () => {
    const scheduledAt = nextBestDailyPublishAt({
      platform: Platform.FACEBOOK,
      existingScheduledDates: [],
      now: new Date("2026-07-15T05:00:00.000Z")
    });

    expect(scheduledAt.toISOString()).toBe("2026-07-15T11:30:00.000Z");
  });

  it("moves to the next open day when today already has a scheduled post", () => {
    const scheduledAt = nextBestDailyPublishAt({
      platform: Platform.GOOGLE_BUSINESS,
      existingScheduledDates: [new Date("2026-07-15T01:00:00.000Z")],
      now: new Date("2026-07-14T23:00:00.000Z")
    });

    expect(scheduledAt.toISOString()).toBe("2026-07-16T01:00:00.000Z");
  });

  it("parses a specific Manila local time into UTC", () => {
    expect(parseManilaSpecificTime("2026-07-16 19:30")?.toISOString()).toBe("2026-07-16T11:30:00.000Z");
  });
});
