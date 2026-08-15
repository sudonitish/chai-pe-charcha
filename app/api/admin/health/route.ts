import { NextResponse } from "next/server"
import { isAdminAuthed } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const start = Date.now()
  let connected = true
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    connected = false
  }
  const pingMs = Date.now() - start

  const [dbSizeRow, tableSizes, memberCount, sessionCount, drinkCount, adjustmentCount, oldestSession] =
    await Promise.all([
      prisma.$queryRaw<{ size: bigint }[]>`SELECT pg_database_size(current_database()) AS size`,
      prisma.$queryRaw<{ table: string; size: bigint }[]>`
        SELECT relname AS table, pg_total_relation_size(relid) AS size
        FROM pg_catalog.pg_statio_user_tables
        ORDER BY size DESC
      `,
      prisma.member.count(),
      prisma.session.count(),
      prisma.drink.count(),
      prisma.debtAdjustment.count(),
      prisma.session.findFirst({ orderBy: { madeAt: "asc" }, select: { madeAt: true } }),
    ])

  return NextResponse.json({
    connected,
    pingMs,
    dbSizeBytes: Number(dbSizeRow[0]?.size ?? 0),
    tables: tableSizes.map((t) => ({ table: t.table, sizeBytes: Number(t.size) })),
    counts: { members: memberCount, sessions: sessionCount, drinks: drinkCount, adjustments: adjustmentCount },
    oldestSessionAt: oldestSession?.madeAt ?? null,
    note: "Table/DB byte sizes come directly from Postgres. Plan storage quota (e.g. Neon's free-tier cap) isn't queryable from here — check that in your Neon dashboard.",
  })
}
