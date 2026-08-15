"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { TEA_DATA_TAG } from "@/lib/cacheTags"
import { checkRequestRateLimit } from "@/lib/requestRateLimit"

async function getCurrentMember() {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated")
  const member = await prisma.member.findUnique({ where: { id: session.memberId } })
  if (!member) throw new Error("Member not found")
  return member
}

export async function makeTea(
  madeAt: string,
  madeById: string,
  drinkerIds: string[],
  taskType: string = "tea",
  taskLabel?: string
) {
  const me = await getCurrentMember()

  const limit = await checkRequestRateLimit(`write:${me.id}`)
  if (!limit.allowed) throw new Error(`Too many entries logged too fast. Try again in ${limit.retryAfterSeconds}s.`)

  const date = new Date(madeAt)
  if (isNaN(date.getTime())) throw new Error("Invalid date")
  if (date > new Date()) throw new Error("Cannot log future entries")

  await prisma.$transaction(async (tx) => {
    const teaSession = await tx.session.create({
      data: {
        madeById,
        loggedById: me.id,
        madeAt: date,
        taskType,
        taskLabel: taskType === "other" ? (taskLabel?.trim() || null) : null,
      },
    })
    if (drinkerIds.length > 0) {
      await tx.drink.createMany({
        data: drinkerIds.map((memberId) => ({ memberId, sessionId: teaSession.id })),
        skipDuplicates: true,
      })
    }

    // Durable, only bumped forward — a backdated entry shouldn't roll this back.
    await tx.member.updateMany({
      where: { id: madeById, OR: [{ lastMadeAt: null }, { lastMadeAt: { lt: date } }] },
      data: { lastMadeAt: date },
    })
  })

  revalidateTag(TEA_DATA_TAG)
  revalidatePath("/")
  revalidatePath("/overview")
}
