/*
  Warnings:

  - You are about to drop the column `loginUri` on the `KeycloakSetup` table. All the data in the column will be lost.
  - Added the required column `tokenUri` to the `KeycloakSetup` table without a default value. This is not possible if the table is not empty.
  - Made the column `clientId` on table `KeycloakSetup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `redirectUri` on table `KeycloakSetup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `scope` on table `KeycloakSetup` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "KeycloakSetup" DROP COLUMN "loginUri",
ADD COLUMN     "tokenUri" TEXT NOT NULL,
ALTER COLUMN "clientId" SET NOT NULL,
ALTER COLUMN "redirectUri" SET NOT NULL,
ALTER COLUMN "scope" SET NOT NULL;
