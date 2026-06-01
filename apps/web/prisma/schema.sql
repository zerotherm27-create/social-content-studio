PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "PublishLog";
DROP TABLE IF EXISTS "PublishJob";
DROP TABLE IF EXISTS "ApprovalRule";
DROP TABLE IF EXISTS "ContentDraft";
DROP TABLE IF EXISTS "Campaign";
DROP TABLE IF EXISTS "SocialAccount";
DROP TABLE IF EXISTS "Brand";
DROP TABLE IF EXISTS "Workspace";

PRAGMA foreign_keys=ON;

CREATE TABLE "Workspace" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Brand" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "initials" TEXT NOT NULL,
  "voice" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "offers" TEXT NOT NULL,
  "bannedPhrases" TEXT NOT NULL,
  "approvalMode" TEXT NOT NULL DEFAULT 'HYBRID',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Brand_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SocialAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "brandId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "connected" BOOLEAN NOT NULL DEFAULT false,
  "tokenStatus" TEXT NOT NULL DEFAULT 'not_connected',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SocialAccount_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "brandId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "targetPlatforms" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ContentDraft" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "brandId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "caption" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "hashtags" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "scheduledAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ContentDraft_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContentDraft_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ApprovalRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "brandId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "requiresReview" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApprovalRule_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PublishJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "draftId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "scheduledAt" DATETIME NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PublishJob_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ContentDraft" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PublishLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "publishJobId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "rawResponse" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublishLog_publishJobId_fkey" FOREIGN KEY ("publishJobId") REFERENCES "PublishJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
