"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

function pad(n: number) { return String(n).padStart(2, "0") }
function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function startOfDay(d: Date) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c }

function Stepper({ value, onInc, onDec, onSet, label }: { value: string; onInc: () => void; onDec: () => void; onSet: (n: number) => void; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onInc}
        aria-label={`Increase ${label}`}
        className="flex items-center justify-center w-9 h-7 rounded-lg hover:opacity-70"
        style={{ background: "var(--muted-bg)", color: "var(--ink)" }}
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        aria-label={label}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(-2)
          onSet(digits === "" ? 0 : parseInt(digits, 10))
        }}
        className="font-display text-2xl tabular w-12 text-center bg-transparent rounded-lg focus:outline-none"
        style={{ color: "var(--ink)", boxShadow: "none" }}
      />
      <button
        type="button"
        onClick={onDec}
        aria-label={`Decrease ${label}`}
        className="flex items-center justify-center w-9 h-7 rounded-lg hover:opacity-70"
        style={{ background: "var(--muted-bg)", color: "var(--ink)" }}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  )
}

export function DateTimePicker({
  date, time, onChangeDate, onChangeTime, max,
}: {
  date: string; time: string; onChangeDate: (v: string) => void; onChangeTime: (v: string) => void; max: Date
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const selected = date ? new Date(date + "T00:00:00") : new Date()
  const [viewMonth, setViewMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1))
  useEffect(() => { if (open) setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1)) }, [open])

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const maxDay = startOfDay(max)
  const todayYmd = ymd(maxDay)
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const canGoNext = new Date(year, month + 1, 1) <= maxDay

  const [h, m] = time.split(":").map((n) => parseInt(n, 10) || 0)
  const hour12 = h % 12 === 0 ? 12 : h % 12
  const isPM = h >= 12

  function setHour(nextHour12: number, pm: boolean) {
    const wrapped = ((nextHour12 - 1) % 12 + 12) % 12 + 1
    let hh = wrapped % 12
    if (pm) hh += 12
    onChangeTime(`${pad(hh)}:${pad(m)}`)
  }
  function setMinute(nextMinute: number) {
    const wrapped = ((nextMinute % 60) + 60) % 60
    onChangeTime(`${pad(h)}:${pad(wrapped)}`)
  }

  const label = viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  const displayDate = selected.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  const displayTime = `${pad(hour12)}:${pad(m)} ${isPM ? "PM" : "AM"}`

  const panel = mounted && open ? createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setOpen(false)} />
      <div
        className="relative z-[71] w-full max-w-[340px] max-h-[85vh] overflow-y-auto board-scroll rounded-2xl border p-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
      >
        {/* Calendar */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:opacity-70"
            style={{ background: "var(--muted-bg)", color: "var(--ink)" }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{label}</span>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:opacity-70 disabled:opacity-30"
            style={{ background: "var(--muted-bg)", color: "var(--ink)" }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-xs font-medium py-1" style={{ color: "var(--muted)" }}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const cellDate = new Date(year, month, day)
            const disabled = cellDate > maxDay
            const isSelected = ymd(cellDate) === date
            const isToday = ymd(cellDate) === todayYmd
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onChangeDate(ymd(cellDate))}
                className={cn(
                  "aspect-square rounded-lg text-xs font-medium transition-colors flex items-center justify-center",
                  disabled && "opacity-25 cursor-not-allowed"
                )}
                style={{
                  background: isSelected ? "var(--accent-solid)" : "transparent",
                  color: isSelected ? "#fff" : "var(--ink)",
                  boxShadow: isToday && !isSelected ? "inset 0 0 0 1.5px var(--accent)" : "none",
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2 text-center" style={{ color: "var(--muted)" }}>Time</p>
          <div className="flex items-center justify-center gap-2">
            <Stepper label="hour" value={pad(hour12)} onInc={() => setHour(hour12 + 1, isPM)} onDec={() => setHour(hour12 - 1, isPM)} onSet={(n) => setHour(n, isPM)} />
            <span className="font-display text-2xl pb-6" style={{ color: "var(--muted)" }}>:</span>
            <Stepper label="minute" value={pad(m)} onInc={() => setMinute(m + 1)} onDec={() => setMinute(m - 1)} onSet={setMinute} />
            <div className="flex flex-col gap-1 ml-1">
              <button
                type="button"
                onClick={() => setHour(hour12, false)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: !isPM ? "var(--accent-solid)" : "var(--muted-bg)", color: !isPM ? "#fff" : "var(--muted)" }}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setHour(hour12, true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: isPM ? "var(--accent-solid)" : "var(--muted-bg)", color: isPM ? "#fff" : "var(--muted)" }}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-primary w-full mt-4 py-2.5 rounded-xl font-semibold text-sm"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-left font-medium"
        style={{ borderColor: "var(--border)", background: "var(--muted-bg)", color: "var(--ink)" }}
      >
        <CalendarIcon className="w-4 h-4 shrink-0" style={{ color: "var(--muted)" }} />
        <span className="truncate">{displayDate}</span>
        <span className="w-px h-4 shrink-0" style={{ background: "var(--border)" }} />
        <Clock className="w-4 h-4 shrink-0" style={{ color: "var(--muted)" }} />
        <span className="truncate">{displayTime}</span>
      </button>
      {panel}
    </>
  )
}
