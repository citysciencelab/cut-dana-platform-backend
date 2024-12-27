-- AlterTable
ALTER TABLE "KeycloakSetup" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "redirectUri" TEXT,
ADD COLUMN     "scope" TEXT;
