import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { isAdminAuthed } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { TEA_DATA_TAG } from "@/lib/cacheTags"

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10) || 30, 100)

  const sessions = await prisma.session.findMany({
    orderBy: { madeAt: "desc" },
    take: limit,
    include: {
      maker: { select: { name: true } },
      logger: { select: { name: true } },
      drinks: { select: { member: { select: { name: true } } } },
    },
  })

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      madeAt: s.madeAt,
      makerName: s.maker.name,
      loggerName: s.logger.name,
      taskType: s.taskType,
      taskLabel: s.taskLabel,
      drinkerNames: s.drinks.map((d) => d.member.name),
      invalid: s.invalidatedAt !== null,
    }))
  )
}

// Mark an entry invalid (excluded from all debt/stat calculations) or restore it.
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, invalid } = await req.json()
  if (!id || typeof invalid !== "boolean") return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  await prisma.session.update({
    where: { id },
    data: { invalidatedAt: invalid ? new Date() : null },
  })
  revalidateTag(TEA_DATA_TAG)
  return NextResponse.json({ ok: true })
}
