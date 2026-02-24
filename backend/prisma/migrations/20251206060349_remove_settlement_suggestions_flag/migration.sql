/*
  Warnings:

  - You are about to drop the column `settlement_suggestions_enabled` on the `groups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "groups" DROP COLUMN "settlement_suggestions_enabled";
