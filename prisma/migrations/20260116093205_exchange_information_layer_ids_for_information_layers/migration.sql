/*
  Warnings:

  - You are about to drop the column `informationLayerIds` on the `StoryStep` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StoryStep" DROP COLUMN "informationLayerIds",
ADD COLUMN     "informationLayers" JSONB NOT NULL DEFAULT '[]'::jsonb,
ALTER COLUMN "mapSources" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "modelUrl" DROP DEFAULT,
ALTER COLUMN "geoJsonAssets" SET DEFAULT '[]'::jsonb;
