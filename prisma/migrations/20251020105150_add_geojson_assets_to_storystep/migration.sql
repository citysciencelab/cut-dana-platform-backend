-- AlterTable
ALTER TABLE "StoryStep" ADD COLUMN     "geoJsonAssets" JSONB NOT NULL DEFAULT '[]'::jsonb,
ALTER COLUMN "mapSources" SET DEFAULT '[]'::jsonb;
