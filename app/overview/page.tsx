import { ChevronLeft, ChevronRight, Trophy } from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { getBaseUrl } from "@/lib/baseUrl"
import { TEA_DATA_TAG } from "@/lib/cacheTags"
import { avatarColor } from "@/app/components/ui/avatarColor"
import { CalendarHeatmap } from "@/app/components/ui/CalendarHeatmap"
import { FadeIn } from "@/app/components/ui/FadeIn"
import { BottomNav } from "@/app/components/ui/BottomNav"

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const month = parseInt(params.month ?? String(now.getMonth() + 1))

  type OverviewSession = {
    id: string; madeById: string; madeAt: string; taskType: string; taskLabel: string | null
    maker: { id: string; name: string }; logger: { name: string }
    drinks: { memberId: string; member: { name: string } }[]
  }
  type OverviewMember = { id: string; name: string; role: string }

  const baseUrl = await getBaseUrl()
  const dataRes = await fetch(`${baseUrl}/api/data/overview?year=${year}&month=${month}`, {
    cache: "force-cache",
    next: { tags: [TEA_DATA_TAG] },
  })
  const { sessions, members }: { sessions: OverviewSession[]; members: OverviewMember[] } = await dataRes.json()

  const memberStats = members.map((m) => {
    const made = sessions.filter((s) => s.madeById === m.id).length
    const drank = sessions.filter((s) => s.drinks.some((d) => d.memberId === m.id)).length
    return { ...m, made, drank, debt: drank - made }
  }).sort((a, b) => b.debt - a.debt)

  const maxMade = Math.max(...memberStats.map((m) => m.made), 1)
  const topMaker = memberStats.slice().sort((a, b) => b.made - a.made)[0]

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  const session = await getSession()
  const me = session ? await prisma.member.findUnique({ where: { id: session.memberId } }) : null
  const meRing = me
    ? (() => { const [bg, fg] = avatarColor(me.name); return { initials: me.name.slice(0, 2).toUpperCase(), bg, fg } })()
    : null

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4">

        <header className="py-5">
          <span className="font-display text-lg" style={{ color: "var(--ink)" }}>Overview</span>
        </header>

        {/* Month navigation */}
        <div className="card flex items-center justify-between rounded-xl px-2 py-1.5 mb-5">
          <a
            href={`/overview?month=${prevMonth}&year=${prevYear}`}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:opacity-80"
            style={{ background: "var(--muted-bg)", color: "var(--ink)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </a>
          <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{monthName}</span>
          <a
            href={isCurrentMonth ? "#" : `/overview?month=${nextMonth}&year=${nextYear}`}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ background: isCurrentMonth ? "transparent" : "var(--muted-bg)", color: isCurrentMonth ? "var(--border)" : "var(--ink)", pointerEvents: isCurrentMonth ? "none" : "auto" }}
          >
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Summary */}
        <FadeIn className="grid grid-cols-2 gap-3 mb-5">
          <div className="card relative overflow-hidden rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Sessions logged</p>
            <p className="font-display text-3xl tabular" style={{ color: "var(--accent)" }}>{sessions.length}</p>
          </div>
          <div className="card rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1" style={{ color: "var(--muted)" }}>
              <Trophy className="w-3 h-3" /> Top maker
            </p>
            {topMaker && topMaker.made > 0 ? (
              <p className="text-lg font-bold leading-tight" style={{ color: "var(--ink)" }}>
                {topMaker.name} <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>· {topMaker.made}×</span>
              </p>
            ) : (
              <p className="text-lg font-bold" style={{ color: "var(--muted)" }}>—</p>
            )}
          </div>
        </FadeIn>

        {/* Member breakdown */}
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Member breakdown</p>
        <div className="card rounded-2xl overflow-hidden mb-5">
          <div className="grid grid-cols-[1fr_44px_44px_60px] px-4 py-2.5" style={{ background: "var(--muted-bg)" }}>
            {["Member", "Made", "Drank", "Debt"].map((h, i) => (
              <p key={h} className={`text-[10px] font-semibold uppercase tracking-wide ${i > 0 ? "text-center" : ""}`} style={{ color: "var(--muted)" }}>{h}</p>
            ))}
          </div>
          {memberStats.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--muted)" }}>No sessions this month.</p>
          ) : memberStats.map((m, i) => {
            const [bg, fg] = avatarColor(m.name)
            const barW = Math.round((m.made / maxMade) * 100)
            return (
              <div key={m.id} className="grid grid-cols-[1fr_44px_44px_60px] items-center px-4 py-3" style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: bg, color: fg }}>
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
                      {m.name}
                      {m.role === "GUEST" && (
                        <span className="text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded shrink-0" style={{ background: "var(--muted-bg)", color: "var(--muted)" }}>
                          Guest
                        </span>
                      )}
                    </p>
                    {m.made > 0 && (
                      <div className="h-1 rounded-full mt-1 overflow-hidden w-full" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full" style={{ width: `${barW}%`, background: "var(--accent)" }} />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm font-medium tabular text-center" style={{ color: "var(--ink)" }}>{m.made}</p>
                <p className="text-sm font-medium tabular text-center" style={{ color: "var(--ink)" }}>{m.drank}</p>
                <p className="text-sm font-bold tabular text-center" style={{ color: m.debt > 0 ? "var(--danger)" : m.debt < 0 ? "var(--success-dark)" : "var(--muted)" }}>
                  {m.debt > 0 ? `+${m.debt}` : m.debt === 0 ? "—" : m.debt}
                </p>
              </div>
            )
          })}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Calendar</p>
        <CalendarHeatmap
          year={year}
          month={month}
          sessions={sessions.map((s) => ({
            id: s.id,
            madeAt: s.madeAt,
            makerName: s.maker.name,
            loggerName: s.logger.name,
            drinkerNames: s.drinks.map((d) => d.member.name),
            taskType: s.taskType,
            taskLabel: s.taskLabel,
          }))}
        />
      </div>
      <BottomNav me={meRing} />
    </div>
  )
}
