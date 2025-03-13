/*
  Warnings:

  - You are about to drop the column `navigation3DId` on the `StoryStep` table. All the data in the column will be lost.
  - You are about to drop the `Navigation3D` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `navigation3D` to the `StoryStep` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StoryStep" DROP CONSTRAINT "StoryStep_navigation3DId_fkey";

-- AlterTable
ALTER TABLE "StoryStep" DROP COLUMN "navigation3DId",
ADD COLUMN     "navigation3D" JSONB NOT NULL;

-- DropTable
DROP TABLE "Navigation3D";
