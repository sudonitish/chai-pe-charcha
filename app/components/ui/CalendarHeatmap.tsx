"use client"

import { useState, useMemo } from "react"
import { Clock, Coffee, Briefcase, Pencil } from "lucide-react"
import { avatarColor } from "./avatarColor"
import { MakeTeaButton } from "../MakeTeaButton"

type SessionRow = {
  id: string
  madeAt: string
  makerId: string
  makerName: string
  loggerId: string
  loggerName: string
  drinkerIds: string[]
  drinkerNames: string[]
  taskType: string
  taskLabel: string | null
  isEdited: boolean
}

type MemberOption = { id: string; name: string }

function dayKey(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function CalendarHeatmap({
  year, month, sessions, members, meId,
}: {
  year: number; month: number; sessions: SessionRow[]; members: MemberOption[]; meId?: string
}) {
  const today = new Date()
  const todayKey = dayKey(today)
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  // Default to today when viewing the current month; otherwise no default selection.
  const [selectedDay, setSelectedDay] = useState<string | null>(isCurrentMonth ? todayKey : null)

  const byDay = useMemo(() => {
    const map = new Map<string, SessionRow[]>()
    for (const s of sessions) {
      const k = dayKey(new Date(s.madeAt))
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(s)
    }
    return map
  }, [sessions])

  const firstDay = new Date(year, month - 1, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const displaySessions = selectedDay ? (byDay.get(selectedDay) ?? []) : sessions
  const showFade = displaySessions.length > 5

  return (
    <div className="space-y-4">
      {/* Calendar grid — three states: no entries, has entries, selected */}
      <div className="card rounded-2xl p-4">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[11px] font-medium py-1" style={{ color: "var(--muted)" }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const cellDate = new Date(year, month - 1, day)
            const key = dayKey(cellDate)
            const count = byDay.get(key)?.length ?? 0
            const isToday = key === todayKey
            const isSelected = selectedDay === key
            const isFuture = cellDate > today
            const hasEntries = count > 0
            return (
              <button
                key={i}
                disabled={!hasEntries}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center relative transition-transform disabled:cursor-default hover:enabled:-translate-y-0.5"
                style={{
                  background: isSelected ? "var(--accent-solid)" : hasEntries ? "var(--accent-soft)" : "var(--muted-bg)",
                  opacity: isFuture ? 0.4 : 1,
                  boxShadow: isToday ? "inset 0 0 0 2px var(--accent)" : "none",
                }}
              >
                <span className="text-xs font-semibold tabular" style={{ color: isSelected ? "#fff" : hasEntries ? "var(--accent-dark)" : "var(--ink)" }}>
                  {day}
                </span>
                {hasEntries && (
                  <span className="text-[9px] font-semibold tabular leading-none mt-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.85)" : "var(--accent-dark)" }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 justify-end">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
            <span className="w-3 h-3 rounded" style={{ background: "var(--muted-bg)" }} /> No entries
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
            <span className="w-3 h-3 rounded" style={{ background: "var(--accent-soft)" }} /> Has entries
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
            <span className="w-3 h-3 rounded" style={{ background: "var(--accent-solid)" }} /> Selected
          </span>
        </div>
      </div>

      {/* Session list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            <Clock className="w-3.5 h-3.5" />
            {selectedDay
              ? new Date(selectedDay + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long" })
              : `All sessions · ${sessions.length}`}
          </p>
          {selectedDay && (
            <button onClick={() => setSelectedDay(null)} className="text-xs font-semibold hover:opacity-70" style={{ color: "var(--accent-dark)" }}>
              Clear
            </button>
          )}
        </div>

        {displaySessions.length === 0 ? (
          <div className="card rounded-2xl py-10 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>No tea made {selectedDay ? "this day" : "this month"}.</p>
          </div>
        ) : (
          <div className={`space-y-2 board-scroll ${showFade ? "fade-scroll-y" : ""}`} style={showFade ? { maxHeight: 400, overflowY: "auto" } : undefined}>
            {displaySessions.map((s) => {
              const [bg, fg] = avatarColor(s.makerName)
              const onBehalf = s.loggerId !== s.makerId
              const isTea = s.taskType !== "other"
              const actionText = isTea ? "made tea" : `did: ${s.taskLabel || "a job"}`
              const canEdit = meId === s.makerId || meId === s.loggerId
              return (
                <div key={s.id} className="card rounded-xl px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: bg, color: fg }}>
                      {s.makerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
                        {isTea ? <Coffee className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--muted)" }} /> : <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--muted)" }} />}
                        <span className="truncate">{s.makerName} {actionText}</span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {new Date(s.madeAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {s.isEdited
                          ? <> · edited by {s.loggerName}</>
                          : onBehalf ? <> · logged by {s.loggerName}</> : <> · logged by self</>}
                      </p>
                      {s.drinkerNames.length > 0 && (
                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                          {isTea ? "Drank" : "Benefited"}: {s.drinkerNames.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="text-xs tabular font-medium px-2 py-1 rounded-full shrink-0" style={{ background: "var(--muted-bg)", color: "var(--muted)" }}>
                      {s.drinkerNames.length}
                    </span>
                    {canEdit && meId && (
                      <MakeTeaButton
                        myId={meId}
                        members={members}
                        editing={{
                          entryId: s.id,
                          madeAt: s.madeAt,
                          madeById: s.makerId,
                          drinkerIds: s.drinkerIds,
                          taskType: s.taskType,
                          taskLabel: s.taskLabel,
                        }}
                        trigger={(onClick) => (
                          <button
                            onClick={onClick}
                            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                            style={{ background: "var(--muted-bg)", color: "var(--muted)" }}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
