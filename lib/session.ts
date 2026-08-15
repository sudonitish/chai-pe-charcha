import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { createHash } from "crypto"

function getSecret() {
  return new TextEncoder().encode(process.env.APP_SECRET!)
}

export function hashPin(pin: string): string {
  return createHash("sha256")
    .update(pin + (process.env.APP_SECRET ?? ""))
    .digest("hex")
}

export async function createSessionToken(memberId: string): Promise<string> {
  return new SignJWT({ memberId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(getSecret())
}

export async function getSession(): Promise<{ memberId: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return { memberId: payload.memberId as string }
  } catch {
    return null
  }
}
