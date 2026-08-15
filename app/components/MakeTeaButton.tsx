"use client"

import { useState, useTransition, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Check, Plus, CheckCircle2, Coffee, Briefcase } from "lucide-react"
import confetti from "canvas-confetti"
import { makeTea } from "@/app/actions"
import { DateTimePicker } from "./ui/DateTimePicker"
import { avatarColor } from "./ui/avatarColor"
import { cn } from "@/lib/utils"

type Member = { id: string; name: string; role?: string }
type TaskType = "tea" | "other"

function pad(n: number) { return String(n).padStart(2, "0") }
function todayYmd() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function nowHm() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function MakeTeaButton({ isMyTurn, myName, myId, members }: {
  isMyTurn: boolean; myName: string; myId: string; members: Member[]
}) {
  const [open, setOpen] = useState(false)
  const [taskType, setTaskType] = useState<TaskType>("tea")
  const [taskLabel, setTaskLabel] = useState("")
  const [date, setDate] = useState(todayYmd())
  const [time, setTime] = useState(nowHm())
  const [madeById, setMadeById] = useState(myId)
  const [drinkerIds, setDrinkerIds] = useState<Set<string>>(new Set([myId]))
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)")
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const isTea = taskType === "tea"
  const doerLabel = isTea ? "Who made tea?" : "Who did it?"
  const beneficiaryLabel = isTea ? "Who drank?" : "Who benefited?"
  const beneficiaryVerb = isTea ? "drank" : "benefited"

  function handleOpen() {
    setTaskType("tea")
    setTaskLabel("")
    setDate(todayYmd())
    setTime(nowHm())
    setMadeById(myId)
    setDrinkerIds(new Set([myId]))
    setError("")
    setOpen(true)
  }

  function toggleDrinker(id: string) {
    setDrinkerIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleSubmit() {
    setError("")
    if (!isTea && !taskLabel.trim()) {
      setError("Say what the job was")
      return
    }
    startTransition(async () => {
      try {
        const iso = new Date(`${date}T${time || "00:00"}:00`).toISOString()
        await makeTea(iso, madeById, Array.from(drinkerIds), taskType, taskLabel)
        setOpen(false)
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          confetti({
            particleCount: 70,
            spread: 65,
            startVelocity: 32,
            origin: { y: 0.7 },
            colors: ["#F76B15", "#A18072", "#FFA057", "#30A46C"],
            disableForReducedMotion: true,
          })
        }
        setToast(true)
        setTimeout(() => setToast(false), 2400)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to log")
      }
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="btn-primary inline-flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-full text-xs font-semibold shrink-0"
      >
        <Plus className="w-4 h-4" /> Log entry
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <motion.div
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.45)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            {/* centering wrapper: bottom on mobile, centered modal on desktop */}
            <div
              className={cn(
                "fixed inset-0 z-50 flex justify-center",
                isDesktop ? "items-center p-4" : "items-end"
              )}
              onClick={() => setOpen(false)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "w-full max-w-md overflow-y-auto board-scroll",
                  isDesktop ? "rounded-3xl max-h-[80vh]" : "rounded-t-3xl max-h-[85vh]"
                )}
                style={{ background: "var(--surface)" }}
                initial={isDesktop ? { opacity: 0, scale: 0.95 } : { y: "100%" }}
                animate={isDesktop ? { opacity: 1, scale: 1 } : { y: 0 }}
                exit={isDesktop ? { opacity: 0, scale: 0.95 } : { y: "100%" }}
                transition={isDesktop ? { duration: 0.18, ease: "easeOut" } : { type: "spring", damping: 28, stiffness: 300 }}
              >
              <div className="px-5 pt-5 pb-8 text-sm">
                {!isDesktop && <div className="w-10 h-1.5 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold" style={{ color: "var(--ink)" }}>Log an entry</span>
                  <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--muted-bg)" }}>
                    <X className="w-3.5 h-3.5" style={{ color: "var(--muted)" }} />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Task type */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>What kind of job?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTaskType("tea")}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all"
                        style={{
                          background: isTea ? "var(--accent-soft)" : "var(--bg)",
                          color: isTea ? "var(--accent-dark)" : "var(--ink)",
                          borderColor: isTea ? "var(--accent)" : "var(--border)",
                        }}
                      >
                        <Coffee className="w-4 h-4" /> Tea
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskType("other")}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all"
                        style={{
                          background: !isTea ? "var(--accent-soft)" : "var(--bg)",
                          color: !isTea ? "var(--accent-dark)" : "var(--ink)",
                          borderColor: !isTea ? "var(--accent)" : "var(--border)",
                        }}
                      >
                        <Briefcase className="w-4 h-4" /> Other job
                      </button>
                    </div>
                    {!isTea && (
                      <input
                        value={taskLabel}
                        onChange={(e) => setTaskLabel(e.target.value)}
                        placeholder="What was the job? e.g. Brought samosas"
                        className="w-full mt-2 rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                        style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--ink)" }}
                      />
                    )}
                  </div>

                  {/* Who did it */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>{doerLabel}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {members.map((m) => {
                        const [bg, fg] = avatarColor(m.name)
                        const sel = madeById === m.id
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMadeById(m.id)}
                            className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all text-xs font-medium"
                            style={{
                              background: sel ? "var(--accent-soft)" : "var(--bg)",
                              color: sel ? "var(--accent-dark)" : "var(--ink)",
                              borderColor: sel ? "var(--accent)" : "var(--border)",
                            }}
                          >
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: bg, color: fg }}>
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate w-full text-center leading-tight">{m.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* When */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>When?</p>
                    <DateTimePicker date={date} time={time} onChangeDate={setDate} onChangeTime={setTime} max={new Date()} />
                  </div>

                  {/* Who benefited */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>{beneficiaryLabel}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {members.map((m) => {
                        const [bg, fg] = avatarColor(m.name)
                        const checked = drinkerIds.has(m.id)
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleDrinker(m.id)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all"
                            style={{
                              background: checked ? "var(--accent-soft)" : "var(--bg)",
                              borderColor: checked ? "var(--accent)" : "var(--border)",
                            }}
                          >
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: bg, color: fg }}>
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium flex-1 truncate" style={{ color: checked ? "var(--accent-dark)" : "var(--ink)" }}>
                              {m.name}
                            </span>
                            {checked && <Check className="w-4 h-4 shrink-0" style={{ color: "var(--accent-dark)" }} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {error && <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{error}</p>}

                  <button
                    onClick={handleSubmit}
                    disabled={isPending || !date || !madeById}
                    className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
                  >
                    {isPending ? "Logging…" : `Log entry · ${drinkerIds.size} ${beneficiaryVerb}`}
                  </button>
                </div>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed z-[60] left-1/2 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg"
            style={{
              bottom: "calc(140px + env(safe-area-inset-bottom))",
              background: "var(--ink)",
              color: "var(--bg)",
              x: "-50%",
            }}
            initial={{ opacity: 0, y: 12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 8, x: "-50%" }}
          >
            <CheckCircle2 className="w-4 h-4" style={{ color: "var(--success)" }} />
            <span className="text-sm font-semibold whitespace-nowrap">Entry logged</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
