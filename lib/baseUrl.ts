import { headers } from "next/headers"

// Derives this app's own origin from the incoming request, so server-side
// fetches to our own API routes resolve correctly in dev, Vercel preview,
// and production without hardcoding a URL.
export async function getBaseUrl() {
  const h = await headers()
  const host = h.get("host")
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https")
  return `${proto}://${host}`
}
