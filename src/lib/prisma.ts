import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma() {
  const rawUrl = process.env.DATABASE_URL || "file:./dev.db";

  // libsql requires an absolute path for local file URLs
  let libsqlUrl = rawUrl;
  if (rawUrl.startsWith("file:") && !rawUrl.startsWith("file:///")) {
    const filePath = rawUrl.replace(/^file:/, "");
    const absolutePath = path.resolve(process.cwd(), filePath);
    libsqlUrl = `file:${absolutePath}`;
  }

  const libsql = createClient({ url: libsqlUrl });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaLibSql(libsql as any);
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
