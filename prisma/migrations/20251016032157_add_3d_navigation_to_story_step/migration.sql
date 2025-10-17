/*
  Warnings:

  - Added the required column `modelUrl` to the `StoryStep` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StoryStep" ADD COLUMN     "modelUrl" TEXT NOT NULL,
ALTER COLUMN "mapSources" SET DEFAULT '[]'::jsonb;
