/*
  Warnings:

  - Added the required column `isDraft` to the `Story` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "isDraft" BOOLEAN NOT NULL;
