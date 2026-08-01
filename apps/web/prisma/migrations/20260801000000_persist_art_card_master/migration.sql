ALTER TABLE "ContentIdea" ADD COLUMN "artCardImageBase64" TEXT;
ALTER TABLE "ContentIdea" ADD COLUMN "artCardImageMimeType" TEXT;
ALTER TABLE "ContentIdea" ADD COLUMN "artCardPrompt" TEXT;
ALTER TABLE "ContentIdea" ADD COLUMN "artCardGeneratedAt" TIMESTAMP(3);

ALTER TABLE "ContentDraft" ADD COLUMN "artCardImageBase64" TEXT;
ALTER TABLE "ContentDraft" ADD COLUMN "artCardImageMimeType" TEXT;
ALTER TABLE "ContentDraft" ADD COLUMN "artCardPrompt" TEXT;
ALTER TABLE "ContentDraft" ADD COLUMN "artCardGeneratedAt" TIMESTAMP(3);
