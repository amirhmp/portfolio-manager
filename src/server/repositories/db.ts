import type { Prisma } from "@/generated/prisma/client";
import type { prisma as prismaClient } from "@/lib/prisma";

/**
 * Every repository function takes a `Db` as its first argument instead of
 * importing the `prisma` singleton directly. This is what lets the same
 * repository functions be reused both for one-off queries (pass the
 * singleton `prisma`) and for multi-step writes that must share one
 * transaction (pass the `tx` client handed to a `prisma.$transaction(async
 * (tx) => ...)` callback) -- see `server/services/gold-accounting.ts`.
 */
export type Db = typeof prismaClient | Prisma.TransactionClient;
