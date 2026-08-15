import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRequestRateLimit, getClientIp } from "@/lib/requestRateLimit"

export async function GET(req: NextRequest) {
  const ip = await getClientIp()
  const limit = await checkRequestRateLimit(`data-overview:${ip}`)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds ?? 60) } }
    )
  }

  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "", 10)
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "", 10)
  if (!year || !month) return NextResponse.json({ error: "Missing year/month" }, { status: 400 })

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  const [sessions, members] = await Promise.all([
    prisma.session.findMany({
      where: { madeAt: { gte: start, lt: end }, invalidatedAt: null },
      include: {
        maker: { select: { id: true, name: true } },
        logger: { select: { name: true } },
        drinks: { select: { memberId: true, member: { select: { name: true } } } },
      },
      orderBy: { madeAt: "asc" },
    }),
    prisma.member.findMany({ orderBy: { joinedAt: "asc" }, select: { id: true, name: true, role: true } }),
  ])

  return NextResponse.json({ sessions, members })
}
