import { Platform } from "./domain";

type DailyTime = {
  hour: number;
  minute: number;
  label: string;
};

export const MANILA_TIME_ZONE = "Asia/Manila";

export const bestDailyPublishTimes: Record<string, DailyTime> = {
  [Platform.FACEBOOK]: { hour: 19, minute: 30, label: "7:30 PM" },
  [Platform.GOOGLE_BUSINESS]: { hour: 9, minute: 0, label: "9:00 AM" },
  [Platform.INSTAGRAM]: { hour: 20, minute: 0, label: "8:00 PM" },
  [Platform.THREADS]: { hour: 18, minute: 30, label: "6:30 PM" },
  [Platform.TIKTOK]: { hour: 20, minute: 30, label: "8:30 PM" },
  [Platform.LINKEDIN]: { hour: 8, minute: 30, label: "8:30 AM" }
};

export function getBestDailyPublishLabel(platform: string) {
  return bestDailyPublishTimes[platform]?.label ?? "9:00 AM";
}

export function nextBestDailyPublishAt(input: {
  platform: string;
  existingScheduledDates: Date[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const time = bestDailyPublishTimes[input.platform] ?? bestDailyPublishTimes[Platform.GOOGLE_BUSINESS];
  const usedDays = new Set(input.existingScheduledDates.map((date) => manilaDateKey(date)));
  let candidateKey = manilaDateKey(now);

  for (let offset = 0; offset < 370; offset += 1) {
    const candidate = manilaDateTimeToUtc(candidateKey, time.hour, time.minute);
    if (candidate > now && !usedDays.has(candidateKey)) {
      return candidate;
    }
    candidateKey = addDaysToManilaDateKey(candidateKey, 1);
  }

  throw new Error("Could not find an available daily schedule slot.");
}

export function parseManilaSpecificTime(value: string) {
  const normalized = value.trim().replace(" ", "T");
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return undefined;

  const [, year, month, day, hour, minute] = match;
  return manilaDateTimeToUtc(`${year}-${month}-${day}`, Number(hour), Number(minute));
}

function manilaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function manilaDateTimeToUtc(dateKey: string, hour: number, minute: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, 0, 0));
}

function addDaysToManilaDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const manilaNoonAsUtc = new Date(Date.UTC(year, month - 1, day + days, 4, 0, 0, 0));
  return manilaDateKey(manilaNoonAsUtc);
}
