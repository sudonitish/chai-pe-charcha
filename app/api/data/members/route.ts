import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRequestRateLimit, getClientIp } from "@/lib/requestRateLimit"

// Shared, non-per-user data — cached by the fetch caller via `next.tags`.
// Same data already visible without login on Home, so no new exposure.
export async function GET() {
  const ip = await getClientIp()
  const limit = await checkRequestRateLimit(`data-members:${ip}`)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds ?? 60) } }
    )
  }

  const members = await prisma.member.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      joinedAt: true,
      lastMadeAt: true,
      // Explicit select, not include — this route has no auth check (by
      // design, it backs the public Home page), so `pin` must never appear here.
      sessionsMade: { where: { invalidatedAt: null }, select: { madeAt: true } },
      drinks: { where: { session: { invalidatedAt: null } }, select: { sessionId: true } },
      adjustments: { select: { delta: true } },
    },
    orderBy: { joinedAt: "asc" },
  })
  return NextResponse.json(members)
}
