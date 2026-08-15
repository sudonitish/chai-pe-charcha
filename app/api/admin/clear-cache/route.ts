import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { isAdminAuthed } from "@/lib/admin"
import { TEA_DATA_TAG } from "@/lib/cacheTags"

export async function POST() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  revalidateTag(TEA_DATA_TAG)
  return NextResponse.json({ ok: true })
}
