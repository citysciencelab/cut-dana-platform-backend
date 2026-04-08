/*
  Warnings:

  - You are about to drop the column `modelUrl` on the `StoryStep` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StoryStep" DROP COLUMN "modelUrl",
ALTER COLUMN "mapSources" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "geoJsonAssets" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "informationLayers" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "models3D" SET DEFAULT '[]'::jsonb;
