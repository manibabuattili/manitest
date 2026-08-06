import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/**
 * On Vercel (serverless), the filesystem is read-only except /tmp.
 * We bake a seeded SQLite DB into the deploy, then copy it to /tmp for use.
 */
function ensureSqliteForServerless() {
  const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  if (!isVercel) return;

  const target = "/tmp/bluconn.db";
  const source = path.join(process.cwd(), "prisma", "dev.db");

  if (!fs.existsSync(target) && fs.existsSync(source)) {
    fs.copyFileSync(source, target);
  }

  if (fs.existsSync(target)) {
    process.env.DATABASE_URL = `file:${target}`;
  }
}

ensureSqliteForServerless();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
