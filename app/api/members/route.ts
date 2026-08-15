import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const members = await prisma.member.findMany({
    where: { role: "RESIDENT" },
    orderBy: { joinedAt: "asc" },
    select: { id: true, name: true },
  })
  return NextResponse.json(members)
}
