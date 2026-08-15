import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPin } from "@/lib/session"
import { getSession } from "@/lib/session"
import { isValidPin, PIN_INVALID_MESSAGE } from "@/lib/pin"
import { checkLock, recordAttempt } from "@/lib/rateLimit"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { currentPin, newPin } = await req.json()
  if (!currentPin || !newPin) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  if (!isValidPin(String(newPin))) return NextResponse.json({ error: PIN_INVALID_MESSAGE }, { status: 400 })

  const lockKey = `change-pin:${session.memberId}`
  const lock = await checkLock(lockKey)
  if (lock.locked) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((lock.retryAfterSeconds ?? 0) / 60)} min.` },
      { status: 429 }
    )
  }

  const member = await prisma.member.findUnique({ where: { id: session.memberId } })
  if (!member || member.pin !== hashPin(String(currentPin))) {
    const result = await recordAttempt(lockKey, false)
    const error = result.locked
      ? `Too many attempts. Try again in ${Math.ceil((result.retryAfterSeconds ?? 0) / 60)} min.`
      : "Current PIN is wrong"
    return NextResponse.json({ error }, { status: result.locked ? 429 : 401 })
  }

  await recordAttempt(lockKey, true)
  await prisma.member.update({ where: { id: session.memberId }, data: { pin: hashPin(String(newPin)) } })

  return NextResponse.json({ ok: true })
}
