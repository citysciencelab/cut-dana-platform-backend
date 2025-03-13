-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_storyId_fkey";

-- DropForeignKey
ALTER TABLE "Datasource" DROP CONSTRAINT "Datasource_stepId_fkey";

-- DropForeignKey
ALTER TABLE "StoryStep" DROP CONSTRAINT "StoryStep_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "ThreeDFiles" DROP CONSTRAINT "ThreeDFiles_storyStepId_fkey";

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Datasource" ADD CONSTRAINT "Datasource_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "StoryStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreeDFiles" ADD CONSTRAINT "ThreeDFiles_storyStepId_fkey" FOREIGN KEY ("storyStepId") REFERENCES "StoryStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStep" ADD CONSTRAINT "StoryStep_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
