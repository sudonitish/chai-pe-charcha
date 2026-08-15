import { isAdminAuthed } from "@/lib/admin"
import { calculateDebts, parseMembersJson } from "@/lib/debt"
import { getBaseUrl } from "@/lib/baseUrl"
import { TEA_DATA_TAG } from "@/lib/cacheTags"
import { AdminLogin } from "./AdminLogin"
import { AdminPanel } from "./AdminPanel"

export default async function AdminPage() {
  const authed = await isAdminAuthed()

  if (!authed) {
    return <AdminLogin />
  }

  const baseUrl = await getBaseUrl()
  const membersRes = await fetch(`${baseUrl}/api/data/members`, { cache: "force-cache", next: { tags: [TEA_DATA_TAG] } })
  const members = parseMembersJson(await membersRes.json())

  const stats = calculateDebts(members)

  return <AdminPanel stats={stats} />
}
