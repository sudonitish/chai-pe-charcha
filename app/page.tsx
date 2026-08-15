import { Coffee, TrendingUp, TrendingDown, Minus, BarChart2, ArrowRight, ListOrdered } from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { calculateDebts, parseMembersJson } from "@/lib/debt"
import { getBaseUrl } from "@/lib/baseUrl"
import { TEA_DATA_TAG } from "@/lib/cacheTags"
import { avatarColor } from "@/app/components/ui/avatarColor"
import { SpotlightRing } from "@/app/components/ui/SpotlightRing"
import { QueueList } from "@/app/components/ui/QueueList"
import { HeroBlobs } from "@/app/components/ui/HeroBlobs"
import { FadeIn } from "@/app/components/ui/FadeIn"
import { BottomNav } from "@/app/components/ui/BottomNav"
import { MakeTeaButton } from "./components/MakeTeaButton"

const CONTAINER = "max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4"

export default async function Home() {
  const session = await getSession()
  const me = session ? await prisma.member.findUnique({ where: { id: session.memberId } }) : null

  const baseUrl = await getBaseUrl()
  const membersRes = await fetch(`${baseUrl}/api/data/members`, { cache: "force-cache", next: { tags: [TEA_DATA_TAG] } })
  const members = parseMembersJson(await membersRes.json())

  const stats = calculateDebts(members)
  const nextMaker = stats[0]
  const memberList = members.map((m) => ({ id: m.id, name: m.name, role: m.role }))

  const meRing = me
    ? (() => { const [bg, fg] = avatarColor(me.name); return { initials: me.name.slice(0, 2).toUpperCase(), bg, fg } })()
    : null

  const [nextBg, nextFg] = nextMaker ? avatarColor(nextMaker.name) : ["#ccc", "#333"]

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <div className={CONTAINER}>

        {/* Brand */}
        <div className="flex items-center gap-2 py-5">
          <Coffee className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <span className="font-display text-base" style={{ color: "var(--ink)" }}>Chai Pe Charcha</span>
        </div>

        {/* Spotlight — only whose turn is next, in full detail */}
        <FadeIn>
          <div className="card relative overflow-hidden rounded-3xl px-6 pt-6 pb-5 mb-6">
            <HeroBlobs />
            <p className="relative text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
              Next up
            </p>
            {nextMaker ? (
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex items-center gap-4">
                  <SpotlightRing initials={nextMaker.name.slice(0, 2).toUpperCase()} bg={nextBg} fg={nextFg} size={84} />
                  <div>
                    <p className="font-display text-4xl leading-none flex items-center gap-2" style={{ color: "var(--ink)" }}>
                      {nextMaker.name}
                      {nextMaker.role === "GUEST" && (
                        <span className="text-[11px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ background: "var(--muted-bg)", color: "var(--muted)" }}>
                          Guest
                        </span>
                      )}
                    </p>
                    <p
                      className="text-sm font-medium flex items-center gap-1.5 mt-1.5"
                      style={{ color: nextMaker.debt > 0 ? "var(--danger)" : nextMaker.debt < 0 ? "var(--success)" : "var(--muted)" }}
                    >
                      {nextMaker.debt > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : nextMaker.debt < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      {nextMaker.debt > 0 ? `Owes ${nextMaker.debt} cup${nextMaker.debt !== 1 ? "s" : ""}` : nextMaker.debt < 0 ? "Ahead of schedule" : "All settled up"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 pt-4 sm:pt-0 sm:pl-5 sm:ml-auto sm:border-l border-t sm:border-t-0" style={{ borderColor: "var(--border)" }}>
                  <div className="pt-4 sm:pt-0">
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Made</p>
                    <p className="font-display text-2xl tabular" style={{ color: "var(--ink)" }}>{nextMaker.totalMakes}</p>
                  </div>
                  <div className="pt-4 sm:pt-0">
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Drank</p>
                    <p className="font-display text-2xl tabular" style={{ color: "var(--ink)" }}>{nextMaker.totalDrinks}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="relative" style={{ color: "var(--ink)" }}>No members yet.</p>
            )}

            <div className="relative flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <a href="/overview" className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: "var(--accent)" }}>
                <BarChart2 className="w-3.5 h-3.5" />
                See monthly stats
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              {me && (
                <MakeTeaButton isMyTurn={nextMaker?.id === me.id} myName={me.name} myId={me.id} members={memberList} />
              )}
            </div>
          </div>
        </FadeIn>

        {/* Full queue — turn order leaderboard */}
        <FadeIn delay={0.08}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            <ListOrdered className="w-3.5 h-3.5" />
            Queue order
          </p>
          {stats.length === 0 ? (
            <div className="card rounded-2xl py-10 text-center">
              <p className="text-sm" style={{ color: "var(--muted)" }}>No members yet.</p>
            </div>
          ) : (
            <QueueList members={stats} meId={me?.id} />
          )}
          <p className="text-xs mt-2 pl-1" style={{ color: "var(--muted)" }}>Highest debt goes first. Full history lives on Stats → Calendar.</p>
        </FadeIn>
      </div>

      <BottomNav me={meRing} />
    </div>
  )
}
