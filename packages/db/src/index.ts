import { PrismaClient } from "./_generated/prisma/client";

const createPrismaClient = () => {
  return new PrismaClient({
    log: ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export * from "./_generated/prisma/client";
