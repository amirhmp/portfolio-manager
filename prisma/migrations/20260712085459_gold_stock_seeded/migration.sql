INSERT INTO "Stock" ("name", "createdAt", "updatedAt")
SELECT 'Gold', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Stock" WHERE "name" = 'Gold');