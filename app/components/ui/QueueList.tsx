import { Flame, Crown } from "lucide-react"
import { avatarColor } from "./avatarColor"
import { DebtCups } from "./DebtCups"

type QueueMember = { id: string; name: string; debt: number; rank: number; role: string }

export function QueueList({ members, meId }: { members: QueueMember[]; meId?: string }) {
  const maxOwed = Math.max(...members.filter((m) => m.debt > 0).map((m) => m.debt), 0)

  return (
    <div className="card rounded-2xl overflow-hidden">
      {members.map((m, i) => {
        const [bg, fg] = avatarColor(m.name)
        const isMe = meId === m.id
        const isTopDebtor = m.debt > 0 && m.debt === maxOwed
        const isMostAhead = m.rank === members.length && m.debt < 0
        return (
          <div
            key={m.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none", background: isMe ? "var(--accent-soft)" : "transparent" }}
          >
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 tabular"
              style={{
                background: m.rank === 1 ? "var(--accent-solid)" : "var(--muted-bg)",
                color: m.rank === 1 ? "#fff" : "var(--muted)",
              }}
            >
              {m.rank}
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: bg, color: fg }}>
              {m.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 flex items-center gap-1.5 text-sm font-semibold truncate" style={{ color: isMe ? "var(--accent-dark)" : "var(--ink)" }}>
              {m.name}
              {isMe && <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>you</span>}
              {m.role === "GUEST" && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--muted-bg)", color: "var(--muted)" }}>
                  Guest
                </span>
              )}
              {isTopDebtor && <Flame className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--danger)" }} />}
              {isMostAhead && <Crown className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />}
            </span>
            <DebtCups debt={m.debt} />
          </div>
        )
      })}
    </div>
  )
}
