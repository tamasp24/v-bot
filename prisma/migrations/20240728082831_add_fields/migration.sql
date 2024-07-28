-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "profile_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gender" TEXT,
    "age" INTEGER,
    "introduction" TEXT,
    "owner" BOOLEAN NOT NULL DEFAULT false,
    "developer" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("developer", "discord_id", "gender", "introduction", "owner", "profile_created") SELECT "developer", "discord_id", "gender", "introduction", "owner", "profile_created" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
