-- AlterTable
ALTER TABLE "StoryStep" ADD COLUMN     "mapSources" JSONB NOT NULL DEFAULT '[]'::jsonb;
