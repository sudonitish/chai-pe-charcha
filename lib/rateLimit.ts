import { prisma } from "@/lib/prisma"

const MAX_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS) || 5
const LOCK_MINUTES = 15

export type LockStatus = { locked: boolean; retryAfterSeconds?: number; remainingAttempts?: number }

export async function checkLock(identifier: string): Promise<LockStatus> {
  const record = await prisma.loginAttempt.findUnique({ where: { identifier } })
  if (record?.lockedUntil && record.lockedUntil > new Date()) {
    return { locked: true, retryAfterSeconds: Math.ceil((record.lockedUntil.getTime() - Date.now()) / 1000) }
  }
  return { locked: false, remainingAttempts: MAX_ATTEMPTS - (record?.failedCount ?? 0) }
}

export async function recordAttempt(identifier: string, success: boolean): Promise<LockStatus> {
  if (success) {
    await prisma.loginAttempt.upsert({
      where: { identifier },
      create: { identifier, failedCount: 0, lockedUntil: null },
      update: { failedCount: 0, lockedUntil: null },
    })
    return { locked: false }
  }

  const existing = await prisma.loginAttempt.findUnique({ where: { identifier } })
  const failedCount = (existing?.failedCount ?? 0) + 1
  const lockedUntil = failedCount >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null

  await prisma.loginAttempt.upsert({
    where: { identifier },
    create: { identifier, failedCount, lockedUntil },
    update: { failedCount, lockedUntil },
  })

  return lockedUntil
    ? { locked: true, retryAfterSeconds: LOCK_MINUTES * 60 }
    : { locked: false, remainingAttempts: MAX_ATTEMPTS - failedCount }
}
