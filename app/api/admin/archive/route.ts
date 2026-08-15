import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { isAdminAuthed } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { TEA_DATA_TAG } from "@/lib/cacheTags"

// Purges sessions/drinks older than `before`, folding each affected member's
// net debt contribution from those rows into their balance first — so nobody's
// standing changes, but the granular history shrinks the DB. Also sweeps up
// every existing DebtAdjustment row (from prior clear-debts and neutralizes)
// and collapses them into one row per member, so adjustments never grow
// unbounded either — this is the one place that compaction happens.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { before } = await req.json()
  if (!before) return NextResponse.json({ error: "Missing cutoff date" }, { status: 400 })

  const cutoff = new Date(before)
  if (isNaN(cutoff.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 })
  // `before` is a date-only string (from <input type="date">), which Date parses as UTC midnight —
  // but the admin's local "today" may already be ahead of UTC (e.g. IST). Give a day of slack so a
  // same-day cutoff never gets rejected as "in the future" purely from timezone offset.
  if (cutoff.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "Cutoff cannot be in the future" }, { status: 400 })
  }

  // Grab every old row regardless of valid/invalid — both get purged for size,
  // but only valid ones contributed to debt, so only those get folded into the balance.
  const oldSessions = await prisma.session.findMany({
    where: { madeAt: { lt: cutoff } },
    select: { id: true, madeById: true, invalidatedAt: true, drinks: { select: { memberId: true } } },
  })

  const netByMember = new Map<string, number>()
  for (const s of oldSessions) {
    if (s.invalidatedAt) continue
    netByMember.set(s.madeById, (netByMember.get(s.madeById) ?? 0) - 1)
    for (const d of s.drinks) {
      netByMember.set(d.memberId, (netByMember.get(d.memberId) ?? 0) + 1)
    }
  }

  // Sum every existing adjustment row per member — these get replaced, not added to.
  const existingAdjustments = await prisma.debtAdjustment.findMany({ select: { memberId: true, delta: true } })
  const existingByMember = new Map<string, number>()
  for (const a of existingAdjustments) {
    existingByMember.set(a.memberId, (existingByMember.get(a.memberId) ?? 0) + a.delta)
  }

  const affectedMemberIds = new Set([...netByMember.keys(), ...existingByMember.keys()])
  const finalByMember = new Map<string, number>()
  for (const memberId of affectedMemberIds) {
    const total = (netByMember.get(memberId) ?? 0) + (existingByMember.get(memberId) ?? 0)
    finalByMember.set(memberId, total)
  }

  const sessionIds = oldSessions.map((s) => s.id)

  await prisma.$transaction([
    // Wipe every existing adjustment row — they're being replaced by the consolidated totals below.
    prisma.debtAdjustment.deleteMany({ where: { memberId: { in: Array.from(affectedMemberIds) } } }),
    ...Array.from(finalByMember.entries())
      .filter(([, delta]) => delta !== 0)
      .map(([memberId, delta]) =>
        prisma.debtAdjustment.create({ data: { memberId, delta, reason: "Neutralize" } })
      ),
    prisma.session.deleteMany({ where: { id: { in: sessionIds } } }),
  ])

  revalidateTag(TEA_DATA_TAG)
  return NextResponse.json({
    ok: true,
    sessionsRemoved: sessionIds.length,
    adjustmentsConsolidated: existingAdjustments.length,
    adjustmentRowsAfter: Array.from(finalByMember.values()).filter((d) => d !== 0).length,
  })
}
