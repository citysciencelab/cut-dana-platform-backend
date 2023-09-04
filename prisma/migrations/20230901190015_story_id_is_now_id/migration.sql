/*
  Warnings:

  - The primary key for the `stories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `storyid` on the `stories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "steps" DROP CONSTRAINT "storyid";

-- AlterTable
ALTER TABLE "stories" DROP CONSTRAINT "stories_pkey",
DROP COLUMN "storyid",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "stories_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "storyid" FOREIGN KEY ("storyid") REFERENCES "stories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
