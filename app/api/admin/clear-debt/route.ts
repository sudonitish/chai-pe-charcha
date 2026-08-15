import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { isAdminAuthed } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { TEA_DATA_TAG } from "@/lib/cacheTags"

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { memberId } = await req.json()
  if (!memberId) return NextResponse.json({ error: "Missing memberId" }, { status: 400 })

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      sessionsMade: { where: { invalidatedAt: null }, select: { id: true } },
      drinks: { where: { session: { invalidatedAt: null } }, select: { id: true } },
      adjustments: { select: { delta: true } },
    },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const currentDebt =
    member.drinks.length - member.sessionsMade.length + member.adjustments.reduce((s, a) => s + a.delta, 0)

  if (currentDebt === 0) return NextResponse.json({ ok: true, delta: 0 })

  await prisma.debtAdjustment.create({
    data: { memberId, delta: -currentDebt, reason: "Cleared" },
  })

  revalidateTag(TEA_DATA_TAG)
  return NextResponse.json({ ok: true, delta: -currentDebt })
}
