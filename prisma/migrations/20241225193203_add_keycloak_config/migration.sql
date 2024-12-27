-- AlterTable
ALTER TABLE "File" ADD COLUMN     "owner" TEXT;

-- CreateTable
CREATE TABLE "KeycloakSetup" (
    "id" SERIAL NOT NULL,
    "loginUri" TEXT NOT NULL,
    "authUri" TEXT NOT NULL,

    CONSTRAINT "KeycloakSetup_pkey" PRIMARY KEY ("id")
);
