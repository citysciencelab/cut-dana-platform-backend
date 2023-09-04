/*
  Warnings:

  - The primary key for the `images` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `imageid` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `storyid` on the `images` table. All the data in the column will be lost.
  - The primary key for the `steps` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `stepid` on the `steps` table. All the data in the column will be lost.
  - You are about to drop the column `storyid` on the `steps` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "steps" DROP CONSTRAINT "storyid";

-- AlterTable
ALTER TABLE "images" DROP CONSTRAINT "images_pkey",
DROP COLUMN "imageid",
DROP COLUMN "storyid",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "story_id" INTEGER,
ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "steps" DROP CONSTRAINT "steps_pkey",
DROP COLUMN "stepid",
DROP COLUMN "storyid",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "story_id" INTEGER,
ADD CONSTRAINT "steps_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "story_id" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
