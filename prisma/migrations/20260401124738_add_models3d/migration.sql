-- AlterTable
ALTER TABLE "StoryStep" ADD COLUMN     "models3D" JSONB NOT NULL DEFAULT '[]'::jsonb,
ALTER COLUMN "mapSources" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "geoJsonAssets" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "informationLayers" SET DEFAULT '[]'::jsonb;
