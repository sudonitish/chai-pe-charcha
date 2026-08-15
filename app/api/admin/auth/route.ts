import { NextRequest, NextResponse } from "next/server"
import { signAdminToken } from "@/lib/admin"
import { checkLock, recordAttempt } from "@/lib/rateLimit"

const ADMIN_IDENTIFIER = "admin"

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  const lock = await checkLock(ADMIN_IDENTIFIER)
  if (lock.locked) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((lock.retryAfterSeconds ?? 0) / 60)} min.` },
      { status: 429 }
    )
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    const result = await recordAttempt(ADMIN_IDENTIFIER, false)
    const error = result.locked
      ? `Too many attempts. Try again in ${Math.ceil((result.retryAfterSeconds ?? 0) / 60)} min.`
      : "Invalid password"
    return NextResponse.json({ error }, { status: result.locked ? 429 : 401 })
  }

  await recordAttempt(ADMIN_IDENTIFIER, true)

  const token = await signAdminToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete("admin_token")
  return res
}
