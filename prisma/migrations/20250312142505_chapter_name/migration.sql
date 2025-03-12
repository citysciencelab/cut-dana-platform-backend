-- Add columns to chapter
ALTER TABLE "Chapter" ADD COLUMN "name" TEXT NOT NULL;
ALTER TABLE "Chapter" ADD COLUMN "sequence" INTEGER NOT NULL;
