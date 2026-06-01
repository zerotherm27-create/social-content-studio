# Owned Social Agent Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production foundation beside the existing static prototype, with a full-stack app shell, local persistence, brand memory, campaign creation, AI-agent draft generation abstraction, review workflow, calendar queue, and manual export.

**Architecture:** Preserve the current root `index.html`, `styles.css`, and `app.js` as the legacy prototype. Create a new Next.js app in `apps/web` with focused modules for domain types, seed data, persistence, policy checks, agent generation, and UI screens. This phase uses local app data and mocked agent generation so the product workflow is testable before OAuth publishing integrations are added.

**Tech Stack:** Next.js App Router, TypeScript, React, Prisma, SQLite for local development, Vitest, Testing Library, Playwright, CSS modules or global CSS, Node 20+.

---

## File Structure

Create:

- `apps/web/package.json` - scripts and dependencies for the production app.
- `apps/web/next.config.ts` - Next.js configuration.
- `apps/web/tsconfig.json` - TypeScript configuration.
- `apps/web/vitest.config.ts` - unit test configuration.
- `apps/web/playwright.config.ts` - browser test configuration.
- `apps/web/prisma/schema.prisma` - database schema.
- `apps/web/src/app/layout.tsx` - root layout.
- `apps/web/src/app/page.tsx` - working dashboard first screen.
- `apps/web/src/app/globals.css` - app styling.
- `apps/web/src/app/api/campaigns/route.ts` - campaign creation/list API.
- `apps/web/src/app/api/campaigns/[campaignId]/generate/route.ts` - draft generation API.
- `apps/web/src/app/api/drafts/[draftId]/approve/route.ts` - approval API.
- `apps/web/src/app/api/drafts/[draftId]/schedule/route.ts` - scheduling API.
- `apps/web/src/app/api/export/route.ts` - manual export API.
- `apps/web/src/lib/db.ts` - Prisma client singleton.
- `apps/web/src/lib/seed.ts` - seed helper for local demo data.
- `apps/web/src/lib/platforms.ts` - platform definitions and constraints.
- `apps/web/src/lib/policy.ts` - approval/autopilot decision logic.
- `apps/web/src/lib/agent/mock-agent.ts` - deterministic generation for MVP.
- `apps/web/src/lib/export.ts` - manual export payload builder.
- `apps/web/src/components/AgentComposer.tsx` - campaign input form.
- `apps/web/src/components/BrandSidebar.tsx` - brand/workspace navigation.
- `apps/web/src/components/DraftBoard.tsx` - platform draft review.
- `apps/web/src/components/CalendarQueue.tsx` - scheduled queue.
- `apps/web/src/components/ConnectedAccounts.tsx` - integration readiness screen.
- `apps/web/tests/policy.test.ts` - policy unit tests.
- `apps/web/tests/mock-agent.test.ts` - generation unit tests.
- `apps/web/tests/export.test.ts` - export unit tests.
- `apps/web/e2e/dashboard.spec.ts` - core workflow browser test.

Modify:

- `docs/superpowers/specs/2026-06-01-owned-social-agent-mvp-design.md` - add a link to this implementation plan after it exists.

Do not modify:

- `index.html`
- `styles.css`
- `app.js`

## Task 1: Scaffold The Production App

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`

- [ ] **Step 1: Create package manifest**

Create `apps/web/package.json`:

```json
{
  "name": "owned-social-agent-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx src/lib/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.16.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^25.0.0",
    "prisma": "^5.22.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create Next config**

Create `apps/web/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
```

- [ ] **Step 3: Create TypeScript config**

Create `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create test config**

Create `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 5: Create browser test config**

Create `apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
});
```

- [ ] **Step 6: Create initial app shell**

Create `apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Owned Social Agent",
  description: "AI social content agent for brands, approvals, scheduling, and publishing."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `apps/web/src/app/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brandMark">OSA</div>
        <p className="eyebrow">Owned Social Agent</p>
        <h1>Agent cockpit</h1>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Production foundation</p>
            <h2>Generate, approve, schedule, publish.</h2>
          </div>
          <button type="button">Manual export</button>
        </header>
      </section>
    </main>
  );
}
```

Create `apps/web/src/app/globals.css`:

```css
:root {
  color-scheme: light;
  --ink: #17201c;
  --muted: #66746e;
  --line: #dce5df;
  --paper: #f8faf7;
  --surface: #ffffff;
  --charcoal: #202a25;
  --mint: #b7f3d3;
  --coral: #ff7d67;
  --blue: #4c7cff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  background: var(--paper);
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 14px;
  background: var(--surface);
  cursor: pointer;
}

.appShell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  padding: 28px;
  color: #eef7f1;
  background: var(--charcoal);
}

.brandMark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  color: #152019;
  background: var(--mint);
  font-weight: 900;
}

.eyebrow {
  margin: 0;
  color: inherit;
  opacity: 0.68;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.workspace {
  display: grid;
  align-content: start;
  gap: 22px;
  padding: 28px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid rgba(220, 229, 223, 0.86);
  border-radius: 8px;
  padding: 20px 22px;
  background: rgba(255, 255, 255, 0.9);
}

.topbar h2 {
  margin: 4px 0 0;
  font-size: 34px;
  line-height: 1.05;
}

@media (max-width: 860px) {
  .appShell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}
```

- [ ] **Step 7: Install dependencies**

Run:

```bash
cd apps/web
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 8: Verify scaffold builds**

Run:

```bash
cd apps/web
npm run build
```

Expected: Next.js production build completes successfully.

- [ ] **Step 9: Commit**

Run:

```bash
git add apps/web
git commit -m "feat: scaffold production social agent app"
```

Expected: commit succeeds if the workspace has been initialized as a git repo.

## Task 2: Add Database Schema And Seed Data

**Files:**

- Create: `apps/web/prisma/schema.prisma`
- Create: `apps/web/src/lib/db.ts`
- Create: `apps/web/src/lib/platforms.ts`
- Create: `apps/web/src/lib/seed.ts`

- [ ] **Step 1: Define Prisma schema**

Create `apps/web/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Workspace {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  brands    Brand[]
}

model Brand {
  id              String          @id @default(cuid())
  workspaceId     String
  name            String
  initials        String
  voice           String
  audience        String
  offers          String
  bannedPhrases   String
  approvalMode    ApprovalMode    @default(HYBRID)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  workspace       Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  campaigns       Campaign[]
  drafts          ContentDraft[]
  socialAccounts  SocialAccount[]
  approvalRules   ApprovalRule[]
}

model SocialAccount {
  id             String   @id @default(cuid())
  brandId        String
  platform       Platform
  displayName    String
  externalId     String
  connected      Boolean  @default(false)
  tokenStatus    String   @default("not_connected")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  brand          Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
}

model Campaign {
  id              String         @id @default(cuid())
  brandId         String
  title           String
  goal            String
  source          String
  targetPlatforms String
  status          CampaignStatus @default(DRAFT)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  brand           Brand          @relation(fields: [brandId], references: [id], onDelete: Cascade)
  drafts          ContentDraft[]
}

model ContentDraft {
  id             String       @id @default(cuid())
  brandId        String
  campaignId     String
  platform       Platform
  caption        String
  mediaType      MediaType
  hashtags       String
  riskLevel      RiskLevel
  approvalStatus ApprovalStatus @default(PENDING_REVIEW)
  scheduledAt    DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  brand          Brand        @relation(fields: [brandId], references: [id], onDelete: Cascade)
  campaign       Campaign     @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  publishJobs    PublishJob[]
}

model ApprovalRule {
  id          String   @id @default(cuid())
  brandId     String
  name        String
  trigger     String
  requiresReview Boolean @default(true)
  createdAt   DateTime @default(now())
  brand       Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
}

model PublishJob {
  id             String       @id @default(cuid())
  draftId        String
  status         PublishStatus @default(QUEUED)
  scheduledAt    DateTime
  attempts       Int          @default(0)
  lastError      String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  draft          ContentDraft @relation(fields: [draftId], references: [id], onDelete: Cascade)
  logs           PublishLog[]
}

model PublishLog {
  id          String     @id @default(cuid())
  publishJobId String
  status      PublishStatus
  message     String
  rawResponse  String
  createdAt   DateTime   @default(now())
  publishJob  PublishJob @relation(fields: [publishJobId], references: [id], onDelete: Cascade)
}

enum ApprovalMode {
  REVIEW
  HYBRID
  AUTOPILOT
}

enum CampaignStatus {
  DRAFT
  GENERATED
  SCHEDULED
  ARCHIVED
}

enum Platform {
  FACEBOOK
  INSTAGRAM
  GOOGLE_BUSINESS
  TIKTOK
  LINKEDIN
}

enum MediaType {
  TEXT
  IMAGE
  VIDEO
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
}

enum ApprovalStatus {
  PENDING_REVIEW
  APPROVED
  AUTOPILOT_READY
  SCHEDULED
  PUBLISHED
  FAILED
}

enum PublishStatus {
  QUEUED
  RUNNING
  SUCCEEDED
  FAILED
}
```

- [ ] **Step 2: Add local environment file**

Create `apps/web/.env`:

```bash
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 3: Create Prisma client singleton**

Create `apps/web/src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

- [ ] **Step 4: Define supported platforms**

Create `apps/web/src/lib/platforms.ts`:

```ts
import { MediaType, Platform } from "@prisma/client";

export type PlatformDefinition = {
  platform: Platform;
  label: string;
  shortLabel: string;
  supportedMedia: MediaType[];
  defaultRequiresReview: boolean;
};

export const platformDefinitions: PlatformDefinition[] = [
  {
    platform: Platform.FACEBOOK,
    label: "Facebook Pages",
    shortLabel: "Facebook",
    supportedMedia: [MediaType.TEXT, MediaType.IMAGE, MediaType.VIDEO],
    defaultRequiresReview: false
  },
  {
    platform: Platform.INSTAGRAM,
    label: "Instagram",
    shortLabel: "Instagram",
    supportedMedia: [MediaType.IMAGE, MediaType.VIDEO],
    defaultRequiresReview: false
  },
  {
    platform: Platform.GOOGLE_BUSINESS,
    label: "Google Business Profile",
    shortLabel: "Google",
    supportedMedia: [MediaType.TEXT, MediaType.IMAGE],
    defaultRequiresReview: false
  },
  {
    platform: Platform.TIKTOK,
    label: "TikTok",
    shortLabel: "TikTok",
    supportedMedia: [MediaType.VIDEO],
    defaultRequiresReview: true
  },
  {
    platform: Platform.LINKEDIN,
    label: "LinkedIn",
    shortLabel: "LinkedIn",
    supportedMedia: [MediaType.TEXT, MediaType.IMAGE, MediaType.VIDEO],
    defaultRequiresReview: true
  }
];

export function getPlatformDefinition(platform: Platform) {
  const definition = platformDefinitions.find((item) => item.platform === platform);
  if (!definition) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return definition;
}
```

- [ ] **Step 5: Create seed script**

Create `apps/web/src/lib/seed.ts`:

```ts
import { ApprovalMode, Platform } from "@prisma/client";
import { db } from "./db";

async function main() {
  const workspace = await db.workspace.upsert({
    where: { id: "demo-workspace" },
    update: {},
    create: {
      id: "demo-workspace",
      name: "Demo Agency Workspace",
      brands: {
        create: {
          id: "demo-brand-luna",
          name: "Luna Brew Cafe",
          initials: "LB",
          voice: "Warm, polished, local, and sensory. Short sentences. Clear calls to action.",
          audience: "Busy professionals, coffee lovers, nearby office workers, and weekend cafe visitors.",
          offers: "Summer cold brew flight, first-week discount, seasonal pastries, private tasting events.",
          bannedPhrases: "guaranteed cure, cheapest in town, miracle",
          approvalMode: ApprovalMode.HYBRID,
          socialAccounts: {
            create: [
              { platform: Platform.FACEBOOK, displayName: "Luna Brew Cafe Page", externalId: "pending-facebook", connected: false },
              { platform: Platform.INSTAGRAM, displayName: "@lunabrewcafe", externalId: "pending-instagram", connected: false },
              { platform: Platform.GOOGLE_BUSINESS, displayName: "Luna Brew Cafe GBP", externalId: "pending-google", connected: false },
              { platform: Platform.TIKTOK, displayName: "@lunabrewcafe", externalId: "pending-tiktok", connected: false },
              { platform: Platform.LINKEDIN, displayName: "Luna Brew Cafe Company", externalId: "pending-linkedin", connected: false }
            ]
          },
          approvalRules: {
            create: [
              { name: "Price claims", trigger: "price|discount|free|guarantee", requiresReview: true },
              { name: "Regulated claims", trigger: "health|legal|medical|financial|political", requiresReview: true },
              { name: "Competitors", trigger: "better than|versus|competitor", requiresReview: true }
            ]
          }
        }
      }
    },
    include: { brands: true }
  });

  console.log(`Seeded ${workspace.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
```

- [ ] **Step 6: Generate and push database**

Run:

```bash
cd apps/web
npm run db:generate
npm run db:push
npm run db:seed
```

Expected: Prisma client is generated, SQLite database is created, and the seed command prints `Seeded Demo Agency Workspace`.

- [ ] **Step 7: Commit**

Run:

```bash
git add apps/web/prisma apps/web/src/lib apps/web/.env
git commit -m "feat: add social agent data model"
```

Expected: commit succeeds if git is initialized.

## Task 3: Add Policy And Mock Agent Tests

**Files:**

- Create: `apps/web/src/lib/policy.ts`
- Create: `apps/web/src/lib/agent/mock-agent.ts`
- Create: `apps/web/tests/policy.test.ts`
- Create: `apps/web/tests/mock-agent.test.ts`

- [ ] **Step 1: Write policy tests**

Create `apps/web/tests/policy.test.ts`:

```ts
import { ApprovalMode, Platform } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { decideApprovalStatus } from "@/lib/policy";

describe("decideApprovalStatus", () => {
  it("requires review when the brand is review-only", () => {
    const decision = decideApprovalStatus({
      approvalMode: ApprovalMode.REVIEW,
      platform: Platform.GOOGLE_BUSINESS,
      caption: "Visit us today for a seasonal latte.",
      ruleTriggers: []
    });

    expect(decision.status).toBe("PENDING_REVIEW");
    expect(decision.riskLevel).toBe("MEDIUM");
    expect(decision.reasons).toContain("Brand is configured for review mode.");
  });

  it("allows low-risk Google Business updates in hybrid mode", () => {
    const decision = decideApprovalStatus({
      approvalMode: ApprovalMode.HYBRID,
      platform: Platform.GOOGLE_BUSINESS,
      caption: "New cold brew flight is available this weekend.",
      ruleTriggers: ["price|discount|free|guarantee"]
    });

    expect(decision.status).toBe("AUTOPILOT_READY");
    expect(decision.riskLevel).toBe("LOW");
  });

  it("requires review when a trigger matches sensitive text", () => {
    const decision = decideApprovalStatus({
      approvalMode: ApprovalMode.HYBRID,
      platform: Platform.FACEBOOK,
      caption: "Get a guaranteed discount this week.",
      ruleTriggers: ["price|discount|free|guarantee"]
    });

    expect(decision.status).toBe("PENDING_REVIEW");
    expect(decision.riskLevel).toBe("HIGH");
    expect(decision.reasons).toContain("Matched approval trigger: price|discount|free|guarantee");
  });

  it("requires review for TikTok by default in hybrid mode", () => {
    const decision = decideApprovalStatus({
      approvalMode: ApprovalMode.HYBRID,
      platform: Platform.TIKTOK,
      caption: "A quick behind-the-scenes cafe video.",
      ruleTriggers: []
    });

    expect(decision.status).toBe("PENDING_REVIEW");
    expect(decision.riskLevel).toBe("MEDIUM");
    expect(decision.reasons).toContain("Platform defaults to review before publishing.");
  });
});
```

- [ ] **Step 2: Run policy tests and verify failure**

Run:

```bash
cd apps/web
npm run test -- tests/policy.test.ts
```

Expected: FAIL because `@/lib/policy` does not exist.

- [ ] **Step 3: Implement policy**

Create `apps/web/src/lib/policy.ts`:

```ts
import { ApprovalMode, ApprovalStatus, Platform, RiskLevel } from "@prisma/client";
import { getPlatformDefinition } from "./platforms";

type PolicyInput = {
  approvalMode: ApprovalMode;
  platform: Platform;
  caption: string;
  ruleTriggers: string[];
};

type PolicyDecision = {
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  reasons: string[];
};

export function decideApprovalStatus(input: PolicyInput): PolicyDecision {
  const reasons: string[] = [];

  if (input.approvalMode === ApprovalMode.REVIEW) {
    return {
      status: ApprovalStatus.PENDING_REVIEW,
      riskLevel: RiskLevel.MEDIUM,
      reasons: ["Brand is configured for review mode."]
    };
  }

  const matchedTrigger = input.ruleTriggers.find((trigger) => {
    const pattern = new RegExp(trigger, "i");
    return pattern.test(input.caption);
  });

  if (matchedTrigger) {
    return {
      status: ApprovalStatus.PENDING_REVIEW,
      riskLevel: RiskLevel.HIGH,
      reasons: [`Matched approval trigger: ${matchedTrigger}`]
    };
  }

  const platformDefinition = getPlatformDefinition(input.platform);
  if (input.approvalMode === ApprovalMode.HYBRID && platformDefinition.defaultRequiresReview) {
    return {
      status: ApprovalStatus.PENDING_REVIEW,
      riskLevel: RiskLevel.MEDIUM,
      reasons: ["Platform defaults to review before publishing."]
    };
  }

  return {
    status: ApprovalStatus.AUTOPILOT_READY,
    riskLevel: RiskLevel.LOW,
    reasons: ["No approval triggers matched."]
  };
}
```

- [ ] **Step 4: Write mock agent tests**

Create `apps/web/tests/mock-agent.test.ts`:

```ts
import { MediaType, Platform } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { generateDrafts } from "@/lib/agent/mock-agent";

describe("generateDrafts", () => {
  it("creates one platform-specific draft per selected platform", () => {
    const drafts = generateDrafts({
      brandName: "Luna Brew Cafe",
      voice: "Warm and premium",
      audience: "busy professionals",
      campaignTitle: "Summer cold brew flight",
      goal: "Launch a new product",
      source: "Three new cold brew flavors with a first-week discount.",
      platforms: [Platform.FACEBOOK, Platform.GOOGLE_BUSINESS, Platform.LINKEDIN]
    });

    expect(drafts).toHaveLength(3);
    expect(drafts.map((draft) => draft.platform)).toEqual([
      Platform.FACEBOOK,
      Platform.GOOGLE_BUSINESS,
      Platform.LINKEDIN
    ]);
    expect(drafts[0].caption).toContain("Luna Brew Cafe");
    expect(drafts[1].mediaType).toBe(MediaType.IMAGE);
    expect(drafts[2].caption).toContain("busy professionals");
  });
});
```

- [ ] **Step 5: Run mock agent tests and verify failure**

Run:

```bash
cd apps/web
npm run test -- tests/mock-agent.test.ts
```

Expected: FAIL because `@/lib/agent/mock-agent` does not exist.

- [ ] **Step 6: Implement deterministic mock agent**

Create `apps/web/src/lib/agent/mock-agent.ts`:

```ts
import { MediaType, Platform } from "@prisma/client";

type GenerateDraftsInput = {
  brandName: string;
  voice: string;
  audience: string;
  campaignTitle: string;
  goal: string;
  source: string;
  platforms: Platform[];
};

export type GeneratedDraft = {
  platform: Platform;
  caption: string;
  mediaType: MediaType;
  hashtags: string[];
};

const platformHooks: Record<Platform, string> = {
  FACEBOOK: "Bring the community into the story.",
  INSTAGRAM: "Make the first line visual and save-worthy.",
  GOOGLE_BUSINESS: "Give nearby customers a clear reason to visit.",
  TIKTOK: "Open with motion, contrast, and a fast reveal.",
  LINKEDIN: "Frame the update as a useful business insight."
};

const platformMedia: Record<Platform, MediaType> = {
  FACEBOOK: MediaType.IMAGE,
  INSTAGRAM: MediaType.IMAGE,
  GOOGLE_BUSINESS: MediaType.IMAGE,
  TIKTOK: MediaType.VIDEO,
  LINKEDIN: MediaType.TEXT
};

export function generateDrafts(input: GenerateDraftsInput): GeneratedDraft[] {
  return input.platforms.map((platform) => {
    const hook = platformHooks[platform];
    return {
      platform,
      mediaType: platformMedia[platform],
      caption: `${hook} ${input.brandName} is sharing ${input.campaignTitle}. ${input.source} Built for ${input.audience}. Tone: ${input.voice}. Goal: ${input.goal}.`,
      hashtags: buildHashtags(input.brandName, input.campaignTitle)
    };
  });
}

function buildHashtags(brandName: string, campaignTitle: string) {
  const words = `${brandName} ${campaignTitle}`
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 5);

  return ["campaign", ...words].map((word) => `#${word.toLowerCase()}`);
}
```

- [ ] **Step 7: Run unit tests**

Run:

```bash
cd apps/web
npm run test
```

Expected: PASS for policy and mock-agent tests.

- [ ] **Step 8: Commit**

Run:

```bash
git add apps/web/src/lib/policy.ts apps/web/src/lib/agent apps/web/tests
git commit -m "feat: add approval policy and mock agent"
```

Expected: commit succeeds if git is initialized.

## Task 4: Add Campaign And Draft APIs

**Files:**

- Create: `apps/web/src/app/api/campaigns/route.ts`
- Create: `apps/web/src/app/api/campaigns/[campaignId]/generate/route.ts`
- Create: `apps/web/src/app/api/drafts/[draftId]/approve/route.ts`
- Create: `apps/web/src/app/api/drafts/[draftId]/schedule/route.ts`

- [ ] **Step 1: Create campaign API**

Create `apps/web/src/app/api/campaigns/route.ts`:

```ts
import { Platform } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const createCampaignSchema = z.object({
  brandId: z.string().min(1),
  title: z.string().min(2),
  goal: z.string().min(2),
  source: z.string().min(2),
  platforms: z.array(z.nativeEnum(Platform)).min(1)
});

export async function GET() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { brand: true, drafts: true }
  });

  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const payload = createCampaignSchema.parse(await request.json());

  const campaign = await db.campaign.create({
    data: {
      brandId: payload.brandId,
      title: payload.title,
      goal: payload.goal,
      source: payload.source,
      targetPlatforms: JSON.stringify(payload.platforms)
    }
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
```

- [ ] **Step 2: Create generation API**

Create `apps/web/src/app/api/campaigns/[campaignId]/generate/route.ts`:

```ts
import { CampaignStatus, Platform } from "@prisma/client";
import { NextResponse } from "next/server";
import { generateDrafts } from "@/lib/agent/mock-agent";
import { db } from "@/lib/db";
import { decideApprovalStatus } from "@/lib/policy";

export async function POST(_request: Request, context: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await context.params;
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: {
        include: { approvalRules: true }
      }
    }
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const platforms = JSON.parse(campaign.targetPlatforms) as Platform[];
  const generatedDrafts = generateDrafts({
    brandName: campaign.brand.name,
    voice: campaign.brand.voice,
    audience: campaign.brand.audience,
    campaignTitle: campaign.title,
    goal: campaign.goal,
    source: campaign.source,
    platforms
  });

  await db.contentDraft.deleteMany({ where: { campaignId: campaign.id } });

  const createdDrafts = [];
  for (const draft of generatedDrafts) {
    const policy = decideApprovalStatus({
      approvalMode: campaign.brand.approvalMode,
      platform: draft.platform,
      caption: draft.caption,
      ruleTriggers: campaign.brand.approvalRules.map((rule) => rule.trigger)
    });

    const created = await db.contentDraft.create({
      data: {
        brandId: campaign.brandId,
        campaignId: campaign.id,
        platform: draft.platform,
        caption: draft.caption,
        mediaType: draft.mediaType,
        hashtags: JSON.stringify(draft.hashtags),
        riskLevel: policy.riskLevel,
        approvalStatus: policy.status
      }
    });
    createdDrafts.push(created);
  }

  await db.campaign.update({
    where: { id: campaign.id },
    data: { status: CampaignStatus.GENERATED }
  });

  return NextResponse.json({ drafts: createdDrafts });
}
```

- [ ] **Step 3: Create approve API**

Create `apps/web/src/app/api/drafts/[draftId]/approve/route.ts`:

```ts
import { ApprovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const draft = await db.contentDraft.update({
    where: { id: draftId },
    data: { approvalStatus: ApprovalStatus.APPROVED }
  });

  return NextResponse.json({ draft });
}
```

- [ ] **Step 4: Create schedule API**

Create `apps/web/src/app/api/drafts/[draftId]/schedule/route.ts`:

```ts
import { ApprovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime()
});

export async function POST(request: Request, context: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await context.params;
  const payload = scheduleSchema.parse(await request.json());
  const scheduledAt = new Date(payload.scheduledAt);

  const draft = await db.contentDraft.update({
    where: { id: draftId },
    data: {
      scheduledAt,
      approvalStatus: ApprovalStatus.SCHEDULED,
      publishJobs: {
        create: {
          scheduledAt
        }
      }
    },
    include: { publishJobs: true }
  });

  return NextResponse.json({ draft });
}
```

- [ ] **Step 5: Build to verify API types**

Run:

```bash
cd apps/web
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

Run:

```bash
git add apps/web/src/app/api
git commit -m "feat: add campaign draft workflow APIs"
```

Expected: commit succeeds if git is initialized.

## Task 5: Build Dashboard UI

**Files:**

- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/components/BrandSidebar.tsx`
- Create: `apps/web/src/components/AgentComposer.tsx`
- Create: `apps/web/src/components/DraftBoard.tsx`
- Create: `apps/web/src/components/CalendarQueue.tsx`
- Create: `apps/web/src/components/ConnectedAccounts.tsx`

- [ ] **Step 1: Create BrandSidebar component**

Create `apps/web/src/components/BrandSidebar.tsx`:

```tsx
import { Brand, SocialAccount } from "@prisma/client";

type BrandWithAccounts = Brand & { socialAccounts: SocialAccount[] };

export function BrandSidebar({ brand }: { brand: BrandWithAccounts }) {
  return (
    <aside className="sidebar">
      <div className="brandMark">{brand.initials}</div>
      <p className="eyebrow">Owned Social Agent</p>
      <h1>{brand.name}</h1>
      <section className="sidebarPanel">
        <p className="eyebrow">Brand memory</p>
        <p>{brand.voice}</p>
      </section>
      <section className="sidebarPanel">
        <p className="eyebrow">Connections</p>
        {brand.socialAccounts.map((account) => (
          <div className="connectionRow" key={account.id}>
            <span>{account.platform.replace("_", " ")}</span>
            <strong>{account.connected ? "Live" : "Ready"}</strong>
          </div>
        ))}
      </section>
    </aside>
  );
}
```

- [ ] **Step 2: Create AgentComposer component**

Create `apps/web/src/components/AgentComposer.tsx`:

```tsx
import { Platform } from "@prisma/client";
import { platformDefinitions } from "@/lib/platforms";

export function AgentComposer({ brandId }: { brandId: string }) {
  return (
    <form className="panel" action="/api/campaigns" method="post">
      <div className="sectionHeading">
        <div>
          <p className="eyebrow">Agent composer</p>
          <h2>Turn one campaign into platform drafts</h2>
        </div>
      </div>
      <input name="brandId" type="hidden" value={brandId} />
      <label>
        Campaign title
        <input name="title" defaultValue="Summer cold brew flight" />
      </label>
      <label>
        Goal
        <input name="goal" defaultValue="Launch a new product and drive store visits" />
      </label>
      <label>
        Source or offer
        <textarea name="source" defaultValue="Three new cold brew flavors with a first-week discount." rows={4} />
      </label>
      <fieldset>
        <legend>Platforms</legend>
        <div className="platformGrid">
          {platformDefinitions.map((definition) => (
            <label className="checkPill" key={definition.platform}>
              <input
                name="platforms"
                type="checkbox"
                value={definition.platform}
                defaultChecked={definition.platform !== Platform.TIKTOK}
              />
              {definition.shortLabel}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit">Create campaign</button>
    </form>
  );
}
```

- [ ] **Step 3: Create DraftBoard component**

Create `apps/web/src/components/DraftBoard.tsx`:

```tsx
import { ContentDraft } from "@prisma/client";

export function DraftBoard({ drafts }: { drafts: ContentDraft[] }) {
  return (
    <section className="panel">
      <div className="sectionHeading">
        <div>
          <p className="eyebrow">Draft review</p>
          <h2>Platform-ready drafts</h2>
        </div>
      </div>
      <div className="draftGrid">
        {drafts.length === 0 ? (
          <p className="muted">Create a campaign and generate drafts to start the review workflow.</p>
        ) : (
          drafts.map((draft) => (
            <article className="draftCard" key={draft.id}>
              <header>
                <strong>{draft.platform.replace("_", " ")}</strong>
                <span>{draft.approvalStatus.replace("_", " ")}</span>
              </header>
              <p>{draft.caption}</p>
              <div className="tagRow">
                {(JSON.parse(draft.hashtags) as string[]).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <footer>
                <span>{draft.riskLevel.toLowerCase()} risk</span>
                <button type="button">Approve</button>
              </footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create CalendarQueue component**

Create `apps/web/src/components/CalendarQueue.tsx`:

```tsx
import { ContentDraft } from "@prisma/client";

export function CalendarQueue({ drafts }: { drafts: ContentDraft[] }) {
  const scheduled = drafts.filter((draft) => draft.scheduledAt);

  return (
    <section className="panel">
      <p className="eyebrow">Calendar queue</p>
      <h2>{scheduled.length} scheduled</h2>
      {scheduled.length === 0 ? (
        <p className="muted">Approved drafts will appear here after scheduling.</p>
      ) : (
        <div className="queueList">
          {scheduled.map((draft) => (
            <div className="queueItem" key={draft.id}>
              <time>{draft.scheduledAt?.toLocaleString()}</time>
              <strong>{draft.platform.replace("_", " ")}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Create ConnectedAccounts component**

Create `apps/web/src/components/ConnectedAccounts.tsx`:

```tsx
import { SocialAccount } from "@prisma/client";

export function ConnectedAccounts({ accounts }: { accounts: SocialAccount[] }) {
  return (
    <section className="panel">
      <p className="eyebrow">Direct integrations</p>
      <h2>Publishing connectors</h2>
      <div className="accountGrid">
        {accounts.map((account) => (
          <article className="accountCard" key={account.id}>
            <strong>{account.platform.replace("_", " ")}</strong>
            <span>{account.displayName}</span>
            <p>{account.connected ? "Connected" : "OAuth setup pending"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Wire dashboard to database**

Replace `apps/web/src/app/page.tsx` with:

```tsx
import { AgentComposer } from "@/components/AgentComposer";
import { BrandSidebar } from "@/components/BrandSidebar";
import { CalendarQueue } from "@/components/CalendarQueue";
import { ConnectedAccounts } from "@/components/ConnectedAccounts";
import { DraftBoard } from "@/components/DraftBoard";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const brand = await db.brand.findFirst({
    include: {
      socialAccounts: true,
      drafts: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!brand) {
    return (
      <main className="emptyState">
        <h1>No brand found</h1>
        <p>Run the database seed command to create the demo workspace.</p>
      </main>
    );
  }

  return (
    <main className="appShell">
      <BrandSidebar brand={brand} />
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Hybrid mode</p>
            <h2>Generate, approve, schedule, publish.</h2>
          </div>
          <button type="button">Manual export</button>
        </header>
        <div className="dashboardGrid">
          <AgentComposer brandId={brand.id} />
          <ConnectedAccounts accounts={brand.socialAccounts} />
        </div>
        <DraftBoard drafts={brand.drafts} />
        <CalendarQueue drafts={brand.drafts} />
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Expand styling**

Append to `apps/web/src/app/globals.css`:

```css
.sidebar h1 {
  margin: 8px 0 0;
  font-size: 25px;
  line-height: 1.08;
}

.sidebarPanel {
  margin-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  padding-top: 18px;
}

.sidebarPanel p:not(.eyebrow) {
  color: rgba(238, 247, 241, 0.76);
  line-height: 1.5;
}

.connectionRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  border-radius: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.07);
}

.connectionRow span {
  text-transform: capitalize;
}

.dashboardGrid {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(320px, 1.05fr);
  gap: 22px;
}

.panel {
  border: 1px solid rgba(220, 229, 223, 0.86);
  border-radius: 8px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.92);
}

.sectionHeading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.sectionHeading h2,
.panel h2 {
  margin: 4px 0 0;
  font-size: 22px;
  line-height: 1.15;
}

label {
  display: grid;
  gap: 7px;
  margin-top: 14px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

input,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 11px 12px;
  color: var(--ink);
  background: #fbfdfb;
}

fieldset {
  margin: 16px 0;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.platformGrid,
.accountGrid,
.draftGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.checkPill {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  background: #fbfdfb;
}

.checkPill input {
  width: auto;
}

.accountCard,
.draftCard,
.queueItem {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  background: #fbfdfb;
}

.accountCard strong,
.accountCard span,
.accountCard p {
  display: block;
  margin: 0;
}

.accountCard span,
.accountCard p,
.muted {
  color: var(--muted);
}

.draftCard {
  display: grid;
  gap: 12px;
}

.draftCard header,
.draftCard footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.draftCard header span,
.draftCard footer span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.tagRow {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tagRow span {
  border-radius: 999px;
  padding: 6px 8px;
  background: rgba(183, 243, 211, 0.42);
  font-size: 12px;
  font-weight: 800;
}

.queueList {
  display: grid;
  gap: 10px;
}

.queueItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.emptyState {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 28px;
  text-align: center;
}

@media (max-width: 980px) {
  .dashboardGrid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 8: Build to verify UI**

Run:

```bash
cd apps/web
npm run build
```

Expected: build succeeds.

- [ ] **Step 9: Commit**

Run:

```bash
git add apps/web/src/app apps/web/src/components
git commit -m "feat: add social agent dashboard"
```

Expected: commit succeeds if git is initialized.

## Task 6: Add Manual Export

**Files:**

- Create: `apps/web/src/lib/export.ts`
- Create: `apps/web/src/app/api/export/route.ts`
- Create: `apps/web/tests/export.test.ts`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Write export tests**

Create `apps/web/tests/export.test.ts`:

```ts
import { ApprovalStatus, MediaType, Platform, RiskLevel } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildManualExport } from "@/lib/export";

describe("buildManualExport", () => {
  it("formats drafts into a portable publishing plan", () => {
    const exported = buildManualExport({
      brandName: "Luna Brew Cafe",
      drafts: [
        {
          platform: Platform.FACEBOOK,
          caption: "Visit Luna Brew Cafe this weekend.",
          mediaType: MediaType.IMAGE,
          hashtags: JSON.stringify(["#luna", "#coffee"]),
          riskLevel: RiskLevel.LOW,
          approvalStatus: ApprovalStatus.APPROVED,
          scheduledAt: new Date("2026-06-03T01:30:00.000Z")
        }
      ]
    });

    expect(exported.brandName).toBe("Luna Brew Cafe");
    expect(exported.posts[0]).toEqual({
      platform: "FACEBOOK",
      caption: "Visit Luna Brew Cafe this weekend.",
      mediaType: "IMAGE",
      hashtags: ["#luna", "#coffee"],
      riskLevel: "LOW",
      approvalStatus: "APPROVED",
      scheduledAt: "2026-06-03T01:30:00.000Z"
    });
  });
});
```

- [ ] **Step 2: Run export test and verify failure**

Run:

```bash
cd apps/web
npm run test -- tests/export.test.ts
```

Expected: FAIL because `@/lib/export` does not exist.

- [ ] **Step 3: Implement export helper**

Create `apps/web/src/lib/export.ts`:

```ts
import { ApprovalStatus, MediaType, Platform, RiskLevel } from "@prisma/client";

type ExportDraft = {
  platform: Platform;
  caption: string;
  mediaType: MediaType;
  hashtags: string;
  riskLevel: RiskLevel;
  approvalStatus: ApprovalStatus;
  scheduledAt: Date | null;
};

export function buildManualExport(input: { brandName: string; drafts: ExportDraft[] }) {
  return {
    exportedAt: new Date().toISOString(),
    brandName: input.brandName,
    posts: input.drafts.map((draft) => ({
      platform: draft.platform,
      caption: draft.caption,
      mediaType: draft.mediaType,
      hashtags: JSON.parse(draft.hashtags) as string[],
      riskLevel: draft.riskLevel,
      approvalStatus: draft.approvalStatus,
      scheduledAt: draft.scheduledAt?.toISOString() ?? null
    }))
  };
}
```

- [ ] **Step 4: Add export payload to page**

Modify `apps/web/src/app/page.tsx` so the topbar button is replaced with:

```tsx
<form action="/api/export" method="get">
  <button type="submit">Manual export</button>
</form>
```

Then create `apps/web/src/app/api/export/route.ts`:

```ts
import { NextResponse } from "next/server";
import { buildManualExport } from "@/lib/export";
import { db } from "@/lib/db";

export async function GET() {
  const brand = await db.brand.findFirst({
    include: { drafts: true }
  });

  if (!brand) {
    return NextResponse.json({ error: "No brand found" }, { status: 404 });
  }

  return NextResponse.json(buildManualExport({ brandName: brand.name, drafts: brand.drafts }));
}
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
cd apps/web
npm run test
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 6: Commit**

Run:

```bash
git add apps/web/src/lib/export.ts apps/web/src/app/api/export apps/web/src/app/page.tsx apps/web/tests/export.test.ts
git commit -m "feat: add manual export payload"
```

Expected: commit succeeds if git is initialized.

## Task 7: Add E2E Smoke Test And Documentation Link

**Files:**

- Create: `apps/web/e2e/dashboard.spec.ts`
- Modify: `docs/superpowers/specs/2026-06-01-owned-social-agent-mvp-design.md`

- [ ] **Step 1: Add browser smoke test**

Create `apps/web/e2e/dashboard.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("dashboard loads the production agent foundation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Generate, approve, schedule, publish." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Turn one campaign into platform drafts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Publishing connectors" })).toBeVisible();
  await expect(page.getByText("Google Business Profile")).toBeVisible();
});
```

- [ ] **Step 2: Run E2E test**

Run:

```bash
cd apps/web
npm run test:e2e
```

Expected: Playwright starts the dev server and the dashboard smoke test passes on desktop and mobile.

- [ ] **Step 3: Link plan from spec**

Append to `docs/superpowers/specs/2026-06-01-owned-social-agent-mvp-design.md`:

```md

## Implementation Plans

- [Owned Social Agent Foundation](../plans/2026-06-01-owned-social-agent-foundation.md)
```

- [ ] **Step 4: Commit**

Run:

```bash
git add apps/web/e2e docs/superpowers/specs/2026-06-01-owned-social-agent-mvp-design.md docs/superpowers/plans/2026-06-01-owned-social-agent-foundation.md
git commit -m "docs: add production foundation implementation plan"
```

Expected: commit succeeds if git is initialized.

## Follow-Up Plans

After this plan is complete, write separate implementation plans for:

- Authentication, users, and workspaces.
- Real AI provider integration.
- Publishing engine and background jobs.
- Google Business Profile connector.
- LinkedIn connector.
- Facebook Pages connector.
- Instagram connector.
- TikTok connector.
- Visual/card generation.
- Autopilot controls and audit timeline.

## Self-Review

Spec coverage:

- Preserves the existing static prototype by creating `apps/web`.
- Covers production foundation, brand memory, campaign drafts, approval policy, calendar queue, and manual export.
- Creates connector-ready platform definitions for Facebook, Instagram, Google Business Profile, TikTok, and LinkedIn.
- Defers real OAuth, publishing jobs, media generation, and autopilot execution to follow-up plans because each is an independent subsystem.

Placeholder scan:

- No `TBD`, `TODO`, or unspecified implementation steps are present.
- Follow-up plans are intentionally named as separate future scopes, not incomplete steps inside this plan.

Type consistency:

- Prisma enum names match TypeScript references.
- API route fields match schema names.
- Component prop types match Prisma include shapes.
