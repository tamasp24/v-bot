-- CreateTable
CREATE TABLE "User" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "profile_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gender" TEXT,
    "introduction" TEXT,
    "owner" BOOLEAN NOT NULL DEFAULT false,
    "developer" BOOLEAN NOT NULL DEFAULT false
);
