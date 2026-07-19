/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Transaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "transactionGroupId" INTEGER NOT NULL,
    "count" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_transactionGroupId_fkey" FOREIGN KEY ("transactionGroupId") REFERENCES "TransactionGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("count", "id", "totalCost", "transactionGroupId", "userId") SELECT "count", "id", "totalCost", "transactionGroupId", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE TABLE "new_TransactionGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER,
    "type" TEXT NOT NULL,
    "count" REAL NOT NULL,
    "unitPrice" REAL,
    "commission" REAL,
    "totalCost" REAL NOT NULL,
    "dealDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionGroup_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TransactionGroup" ("commission", "count", "createdAt", "id", "stockId", "totalCost", "type", "unitPrice") SELECT "commission", "count", "createdAt", "id", "stockId", "totalCost", "type", "unitPrice" FROM "TransactionGroup";
DROP TABLE "TransactionGroup";
ALTER TABLE "new_TransactionGroup" RENAME TO "TransactionGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
