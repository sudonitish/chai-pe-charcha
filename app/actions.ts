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

function parseEntryInput(madeAt: string) {
  const date = new Date(madeAt)
  if (isNaN(date.getTime())) throw new Error("Invalid date")
  if (date > new Date()) throw new Error("Cannot log future entries")
  return date
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

  const date = parseEntryInput(madeAt)

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

// Editing replaces the entry: the original is invalidated (excluded from every
// calculation, same as an admin invalidate) and a fresh row is created in its
// place with originalId pointing back — so "edited by X" falls out of the
// existing loggedById/logger display for free, no separate audit field needed.
export async function editEntry(
  entryId: string,
  madeAt: string,
  madeById: string,
  drinkerIds: string[],
  taskType: string = "tea",
  taskLabel?: string
) {
  const me = await getCurrentMember()

  const limit = await checkRequestRateLimit(`write:${me.id}`)
  if (!limit.allowed) throw new Error(`Too many entries logged too fast. Try again in ${limit.retryAfterSeconds}s.`)

  const original = await prisma.session.findUnique({ where: { id: entryId } })
  if (!original) throw new Error("Entry not found")
  if (original.invalidatedAt) throw new Error("This entry was already edited or invalidated")
  if (me.id !== original.madeById && me.id !== original.loggedById) {
    throw new Error("Only the person who made or logged this entry can edit it")
  }

  const date = parseEntryInput(madeAt)

  await prisma.$transaction(async (tx) => {
    await tx.session.update({ where: { id: entryId }, data: { invalidatedAt: new Date() } })

    const newSession = await tx.session.create({
      data: {
        madeById,
        loggedById: me.id,
        madeAt: date,
        taskType,
        taskLabel: taskType === "other" ? (taskLabel?.trim() || null) : null,
        originalId: entryId,
      },
    })
    if (drinkerIds.length > 0) {
      await tx.drink.createMany({
        data: drinkerIds.map((memberId) => ({ memberId, sessionId: newSession.id })),
        skipDuplicates: true,
      })
    }

    await tx.member.updateMany({
      where: { id: madeById, OR: [{ lastMadeAt: null }, { lastMadeAt: { lt: date } }] },
      data: { lastMadeAt: date },
    })
  })

  revalidateTag(TEA_DATA_TAG)
  revalidatePath("/")
  revalidatePath("/overview")
}
