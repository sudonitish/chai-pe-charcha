import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { isAdminAuthed } from "@/lib/admin"
import { hashPin } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { TEA_DATA_TAG } from "@/lib/cacheTags"
import { isValidPin, PIN_INVALID_MESSAGE } from "@/lib/pin"

export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const members = await prisma.member.findMany({
    orderBy: { joinedAt: "asc" },
    select: { id: true, name: true, joinedAt: true, role: true },
  })
  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, pin, role } = await req.json()
  const isGuest = role === "GUEST"
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })
  if (!isGuest && !pin) return NextResponse.json({ error: "PIN required" }, { status: 400 })
  if (!isGuest && !isValidPin(String(pin))) return NextResponse.json({ error: PIN_INVALID_MESSAGE }, { status: 400 })

  const member = await prisma.member.create({
    data: {
      name: name.trim(),
      role: isGuest ? "GUEST" : "RESIDENT",
      pin: isGuest ? null : hashPin(String(pin)),
    },
  })
  revalidateTag(TEA_DATA_TAG)
  return NextResponse.json({ id: member.id, name: member.name })
}

// Rename, reset PIN, and/or change role (resident <-> guest) — any combination in one call.
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, pin, role, name } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  if (pin && !isValidPin(String(pin))) return NextResponse.json({ error: PIN_INVALID_MESSAGE }, { status: 400 })

  if (typeof name === "string") {
    if (!name.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })
    await prisma.member.update({ where: { id }, data: { name: name.trim() } })
    if (!pin && !role) {
      revalidateTag(TEA_DATA_TAG)
      return NextResponse.json({ ok: true })
    }
  }

  if (role === "GUEST") {
    // Demoting to guest revokes login ability — clear the PIN.
    await prisma.member.update({ where: { id }, data: { role: "GUEST", pin: null } })
    revalidateTag(TEA_DATA_TAG)
    return NextResponse.json({ ok: true })
  }

  if (role === "RESIDENT") {
    if (!pin) return NextResponse.json({ error: "PIN required to make resident" }, { status: 400 })
    await prisma.member.update({ where: { id }, data: { role: "RESIDENT", pin: hashPin(String(pin)) } })
    revalidateTag(TEA_DATA_TAG)
    return NextResponse.json({ ok: true })
  }

  if (!pin) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  await prisma.member.update({ where: { id }, data: { pin: hashPin(String(pin)) } })
  revalidateTag(TEA_DATA_TAG)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.member.delete({ where: { id } })
  revalidateTag(TEA_DATA_TAG)
  return NextResponse.json({ ok: true })
}
