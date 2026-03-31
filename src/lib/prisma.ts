import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbUrl(): string {
  const raw = process.env.DATABASE_URL || "file:dev.db";
  // PrismaLibSql (Prisma 7) needs an absolute file URL
  if (raw.startsWith("file:") && !raw.startsWith("file:///")) {
    const filePath = raw.replace(/^file:[./\\]*/, "");
    const abs = path.resolve(process.cwd(), filePath);
    return `file://${abs}`; // → file:///absolute/path/dev.db
  }
  return raw;
}

// Prisma 7: PrismaLibSql accepts a config object, not a client instance
const adapter = new PrismaLibSql({ url: getDbUrl() });

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
