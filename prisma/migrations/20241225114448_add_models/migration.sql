/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Layer" (
    "id" SERIAL NOT NULL,
    "transparency" DOUBLE PRECISION NOT NULL,
    "selectionIDX" INTEGER NOT NULL,

    CONSTRAINT "Layer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Navigation3D" (
    "id" SERIAL NOT NULL,
    "cameraPosition" DOUBLE PRECISION[],
    "heading" DOUBLE PRECISION NOT NULL,
    "pitch" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Navigation3D_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Datasource" (
    "id" SERIAL NOT NULL,
    "stepId" INTEGER NOT NULL,

    CONSTRAINT "Datasource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreeDFiles" (
    "fileId" INTEGER NOT NULL,
    "storyStepId" INTEGER NOT NULL,

    CONSTRAINT "ThreeDFiles_pkey" PRIMARY KEY ("fileId","storyStepId")
);

-- CreateTable
CREATE TABLE "wmsLayer" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "selectedLayers" TEXT[],
    "stepId" INTEGER NOT NULL,

    CONSTRAINT "wmsLayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orientation" (
    "id" SERIAL NOT NULL,
    "heading" DOUBLE PRECISION NOT NULL,
    "roll" DOUBLE PRECISION NOT NULL,
    "pitch" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Orientation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectedModelId" (
    "id" SERIAL NOT NULL,
    "modelId" TEXT NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL,
    "orientationId" INTEGER NOT NULL,
    "positionId" INTEGER,

    CONSTRAINT "SelectedModelId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryStep" (
    "id" SERIAL NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "stepWidth" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL,
    "title" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "centerCoordinate" DOUBLE PRECISION[],
    "zoomLevel" INTEGER NOT NULL,
    "interactionAddons" TEXT[],
    "is3D" BOOLEAN NOT NULL,
    "navigation3DId" INTEGER NOT NULL,
    "backgroundMapId" TEXT NOT NULL,

    CONSTRAINT "StoryStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMetaData" JSONB NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "storyInterval" INTEGER NOT NULL,
    "titleImageId" INTEGER NOT NULL,
    "displayType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "owner" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[],
    "featured" BOOLEAN NOT NULL,
    "views" INTEGER NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Datasource" ADD CONSTRAINT "Datasource_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "StoryStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreeDFiles" ADD CONSTRAINT "ThreeDFiles_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreeDFiles" ADD CONSTRAINT "ThreeDFiles_storyStepId_fkey" FOREIGN KEY ("storyStepId") REFERENCES "StoryStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wmsLayer" ADD CONSTRAINT "wmsLayer_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "StoryStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectedModelId" ADD CONSTRAINT "SelectedModelId_orientationId_fkey" FOREIGN KEY ("orientationId") REFERENCES "Orientation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectedModelId" ADD CONSTRAINT "SelectedModelId_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStep" ADD CONSTRAINT "StoryStep_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStep" ADD CONSTRAINT "StoryStep_navigation3DId_fkey" FOREIGN KEY ("navigation3DId") REFERENCES "Navigation3D"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_titleImageId_fkey" FOREIGN KEY ("titleImageId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
