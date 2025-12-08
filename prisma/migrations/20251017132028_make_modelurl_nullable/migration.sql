-- AlterTable
ALTER TABLE "StoryStep" ALTER COLUMN "mapSources" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "modelUrl" DROP NOT NULL;
