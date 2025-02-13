-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_titleImageId_fkey";

-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "titleImageId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_titleImageId_fkey" FOREIGN KEY ("titleImageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
