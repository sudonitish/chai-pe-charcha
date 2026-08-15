import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

// Runs in Node.js runtime (regular Route Handlers, not Edge Middleware) so it
// can use Prisma directly — no experimental APIs, no new infra dependency.
// Fixed-window counter per IP, stored in Postgres (RateLimitBucket).
const WINDOW_MS = 60_000
const MAX_REQUESTS = Number(process.env.MAX_REQUESTS_PER_MINUTE) || 60

export async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return h.get("x-real-ip") ?? "unknown"
}

export async function checkRequestRateLimit(
  identifier: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const now = new Date()
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { identifier } })

  if (!bucket || now.getTime() - bucket.windowStart.getTime() > WINDOW_MS) {
    await prisma.rateLimitBucket.upsert({
      where: { identifier },
      create: { identifier, windowStart: now, count: 1 },
      update: { windowStart: now, count: 1 },
    })
    return { allowed: true }
  }

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now.getTime() - bucket.windowStart.getTime())) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  await prisma.rateLimitBucket.update({ where: { identifier }, data: { count: { increment: 1 } } })
  return { allowed: true }
}
