-- AlterTable
ALTER TABLE "StoryStep" ADD COLUMN "layers3D" JSONB NOT NULL DEFAULT '[]'::jsonb;
