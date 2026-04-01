-- AlterTable
ALTER TABLE "StoryStep" ALTER COLUMN "mapSources" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "geoJsonAssets" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "informationLayers" SET DEFAULT '[]'::jsonb;
