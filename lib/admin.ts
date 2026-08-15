import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

function getSecret() {
  return new TextEncoder().encode(process.env.APP_SECRET!)
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (!token) return false
  return verifyAdminToken(token)
}
