import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { ChangePinForm } from "./ChangePinForm"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const me = await prisma.member.findUnique({ where: { id: session.memberId } })
  if (!me) redirect("/login")

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 pb-10">
        <ChangePinForm name={me.name} />
      </div>
    </div>
  )
}
