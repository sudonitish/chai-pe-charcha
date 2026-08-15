import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function withExplicitSslMode(url: string) {
  const u = new URL(url)
  const mode = u.searchParams.get("sslmode")
  if (mode === "prefer" || mode === "require" || mode === "verify-ca") {
    u.searchParams.set("sslmode", "verify-full")
  }
  return u.toString()
}

const adapter = new PrismaPg({ connectionString: withExplicitSslMode(process.env.DATABASE_URL!) })

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["error"] : [] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
