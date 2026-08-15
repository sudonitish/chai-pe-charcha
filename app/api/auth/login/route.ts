import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPin, createSessionToken } from "@/lib/session"
import { checkLock, recordAttempt } from "@/lib/rateLimit"

export async function POST(req: NextRequest) {
  const { memberId, pin } = await req.json()
  if (!memberId || !pin) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const lock = await checkLock(memberId)
  if (lock.locked) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((lock.retryAfterSeconds ?? 0) / 60)} min.` },
      { status: 429 }
    )
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member || member.pin !== hashPin(String(pin))) {
    const result = await recordAttempt(memberId, false)
    const error = result.locked
      ? `Too many attempts. Try again in ${Math.ceil((result.retryAfterSeconds ?? 0) / 60)} min.`
      : "Wrong PIN"
    return NextResponse.json({ error }, { status: result.locked ? 429 : 401 })
  }

  await recordAttempt(memberId, true)

  const token = await createSessionToken(member.id)
  const res = NextResponse.json({ ok: true })
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
  return res
}
