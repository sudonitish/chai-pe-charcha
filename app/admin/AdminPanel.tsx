"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, Trash2, LogOut, ArrowLeft, User, KeyRound, Users,
  UserCircle, Ban, CheckCircle2, Coffee, Briefcase, Archive, Activity, Database, Pencil, RefreshCw,
} from "lucide-react"
import type { MemberStats } from "@/lib/debt"
import { PIN_PATTERN, PIN_MAX_LENGTH, PIN_INVALID_MESSAGE } from "@/lib/pin"
import { TextField } from "@/app/components/ui/Field"
import { avatarColor } from "@/app/components/ui/avatarColor"

type EntryRow = {
  id: string; madeAt: string; makerName: string; loggerName: string
  taskType: string; taskLabel: string | null; drinkerNames: string[]; invalid: boolean
}

type Health = {
  connected: boolean; pingMs: number; dbSizeBytes: number
  tables: { table: string; sizeBytes: number }[]
  counts: { members: number; sessions: number; drinks: number; adjustments: number }
  oldestSessionAt: string | null
  note: string
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export function AdminPanel({ stats }: { stats: MemberStats[] }) {
  const [newName, setNewName] = useState("")
  const [newPin, setNewPin] = useState("")
  const [newIsGuest, setNewIsGuest] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState("")

  const [promoteId, setPromoteId] = useState<string | null>(null)
  const [promotePin, setPromotePin] = useState("")
  const [promoteError, setPromoteError] = useState("")

  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editPin, setEditPin] = useState("")
  const [editError, setEditError] = useState("")

  const [entries, setEntries] = useState<EntryRow[]>([])
  const [entriesLoading, setEntriesLoading] = useState(true)

  const [health, setHealth] = useState<Health | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  // Suggested safe cutoff: the earliest "last made tea" date across everyone —
  // archiving up to here never touches anyone's most recent entry, so the
  // rotation's tie-break (lastMadeAt) is never at risk regardless of what's purged.
  const membersWithHistory = stats.filter((s) => s.lastMadeAt !== null)
  const safeCutoff = membersWithHistory.length > 0
    ? new Date(Math.min(...membersWithHistory.map((s) => s.lastMadeAt!.getTime())))
    : null
  const safeCutoffStr = safeCutoff ? safeCutoff.toISOString().slice(0, 10) : ""

  const [archiveDate, setArchiveDate] = useState(safeCutoffStr)
  const [archiving, setArchiving] = useState(false)
  const [archiveResult, setArchiveResult] = useState("")

  const [clearingCache, setClearingCache] = useState(false)
  const [cacheCleared, setCacheCleared] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/sessions?limit=30")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { setEntries(d); setEntriesLoading(false) })
      .catch(() => setEntriesLoading(false))

    fetch("/api/admin/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setHealth(d); setHealthLoading(false) })
      .catch(() => setHealthLoading(false))
  }, [])

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || (!newIsGuest && !newPin)) return
    setAdding(true); setAddError("")
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), pin: newIsGuest ? undefined : newPin, role: newIsGuest ? "GUEST" : "RESIDENT" }),
    })
    setAdding(false)
    if (res.ok) { setNewName(""); setNewPin(""); setNewIsGuest(false); router.refresh() }
    else { const d = await res.json(); setAddError(d.error ?? "Failed") }
  }

  async function makeGuest(id: string, name: string) {
    if (!confirm(`Make ${name} a guest? Their PIN will be revoked — they won't be able to sign in.`)) return
    await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: "GUEST" }),
    })
    router.refresh()
  }

  async function makeResident(e: React.FormEvent) {
    e.preventDefault()
    if (!promoteId || !promotePin) return
    setPromoteError("")
    const res = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: promoteId, role: "RESIDENT", pin: promotePin }),
    })
    if (!res.ok) { const d = await res.json(); setPromoteError(d.error ?? "Failed"); return }
    setPromoteId(null); setPromotePin("")
    router.refresh()
  }

  // Combined rename + PIN reset — either field alone, or both together, in one save.
  async function saveMemberEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId || !editName.trim()) return
    setEditError("")
    const res = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, name: editName.trim(), ...(editPin ? { pin: editPin } : {}) }),
    })
    if (!res.ok) { const d = await res.json(); setEditError(d.error ?? "Failed"); return }
    setEditId(null); setEditName(""); setEditPin("")
    router.refresh()
  }

  async function clearDebt(id: string, name: string) {
    if (!confirm(`Clear ${name}'s debt to zero?`)) return
    await fetch("/api/admin/clear-debt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: id }),
    })
    router.refresh()
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Delete ${name}? All their tea history will be removed.`)) return
    await fetch("/api/admin/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  async function toggleEntryValid(id: string, invalid: boolean) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, invalid } : e)))
    await fetch("/api/admin/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, invalid }),
    })
    router.refresh()
  }

  async function runArchive(e: React.FormEvent) {
    e.preventDefault()
    if (!archiveDate) return
    if (!confirm(`Neutralize all entries before ${archiveDate}? Their debt impact is preserved as a balance adjustment, but the detailed log rows are permanently removed.`)) return
    setArchiving(true); setArchiveResult("")
    const res = await fetch("/api/admin/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ before: archiveDate }),
    })
    const d = await res.json()
    setArchiving(false)
    setArchiveResult(res.ok ? `Removed ${d.sessionsRemoved} entries. Consolidated ${d.adjustmentsConsolidated} old balance rows into ${d.adjustmentRowsAfter}.` : (d.error ?? "Failed"))
    router.refresh()
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" })
    router.refresh()
  }

  async function clearCache() {
    setClearingCache(true)
    await fetch("/api/admin/clear-cache", { method: "POST" })
    setClearingCache(false)
    setCacheCleared(true)
    // Delay the refresh until after the confirmation has been visible for a
    // moment — firing it immediately re-renders the page in the same tick
    // and the "Cache cleared" text never gets a chance to actually show.
    setTimeout(() => {
      setCacheCleared(false)
      router.refresh()
    }, 1500)
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto px-4 pb-10">

        {/* Header */}
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <a href="/" className="card flex items-center justify-center w-9 h-9 rounded-xl hover:opacity-70 transition-colors" style={{ color: "var(--ink)" }}>
              <ArrowLeft className="w-4 h-4" />
            </a>
            <span className="font-display text-lg" style={{ color: "var(--ink)" }}>Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearCache}
              disabled={clearingCache}
              className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-colors px-3 py-1.5 rounded-full disabled:opacity-50"
              style={{ color: "var(--muted)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${clearingCache ? "animate-spin" : ""}`} />
              {clearingCache ? "Clearing…" : cacheCleared ? "Cache cleared ✓" : "Clear cache"}
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-colors px-3 py-1.5 rounded-full" style={{ color: "var(--muted)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </div>
        </header>

        <div className="mb-4">
          {/* Add member */}
          <div className="card rounded-2xl p-5 max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.1em] mb-4 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              <Users className="w-3.5 h-3.5" />
              Add Member
            </p>
            <form onSubmit={addMember} className="space-y-3">
              <TextField
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Full name"
                icon={<User className="w-4 h-4" />}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewIsGuest(false)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-semibold"
                  style={{ background: !newIsGuest ? "var(--accent-soft)" : "var(--bg)", color: !newIsGuest ? "var(--accent-dark)" : "var(--ink)", borderColor: !newIsGuest ? "var(--accent)" : "var(--border)" }}
                >
                  <UserCircle className="w-4 h-4" /> Resident
                </button>
                <button
                  type="button"
                  onClick={() => setNewIsGuest(true)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-semibold"
                  style={{ background: newIsGuest ? "var(--accent-soft)" : "var(--bg)", color: newIsGuest ? "var(--accent-dark)" : "var(--ink)", borderColor: newIsGuest ? "var(--accent)" : "var(--border)" }}
                >
                  <Users className="w-4 h-4" /> Guest
                </button>
              </div>
              {!newIsGuest && (
                <TextField
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="PIN (share with member)"
                  maxLength={PIN_MAX_LENGTH}
                  pattern={PIN_PATTERN}
                  title={PIN_INVALID_MESSAGE}
                  icon={<KeyRound className="w-4 h-4" />}
                />
              )}
              {newIsGuest && (
                <p className="text-xs" style={{ color: "var(--muted)" }}>Guests have no PIN and can't sign in — someone else logs entries on their behalf.</p>
              )}
              <button
                type="submit"
                disabled={adding || !newName.trim() || (!newIsGuest && !newPin)}
                className="btn-primary w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                {adding ? "Adding…" : "Add Member"}
              </button>
              {addError && <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{addError}</p>}
            </form>
          </div>
        </div>

        {/* Members table */}
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "var(--muted)" }}>
            Members · {stats.length}
          </p>
          <div className="card rounded-2xl overflow-hidden">
            {stats.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>No members yet. Add one above.</p>
            ) : stats.map((s, i) => {
              const [bg, fg] = avatarColor(s.name)
              const isGuest = s.role === "GUEST"
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 px-5 py-4 flex-wrap ${i < stats.length - 1 ? "border-b" : ""}`}
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ background: bg, color: fg }}>
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
                      {s.name}
                      {isGuest && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--muted-bg)", color: "var(--muted)" }}>
                          Guest
                        </span>
                      )}
                    </p>
                    <p className="text-xs tabular" style={{ color: "var(--muted)" }}>
                      {s.totalMakes}m · {s.totalDrinks}d ·{" "}
                      <span style={{ color: s.debt > 0 ? "var(--danger)" : s.debt < 0 ? "var(--success-dark)" : "var(--muted)" }}>
                        {s.debt > 0 ? `+${s.debt} owes` : s.debt < 0 ? `${s.debt} credit` : "even"}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditId(editId === s.id ? null : s.id)
                      setEditName(s.name)
                      setEditPin("")
                      setEditError("")
                    }}
                    className="flex items-center justify-center w-9 h-9 rounded-xl hover:opacity-70 transition-colors shrink-0"
                    style={{ background: "var(--muted-bg)", color: "var(--ink)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {s.debt !== 0 && (
                    <button
                      onClick={() => clearDebt(s.id, s.name)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0"
                      style={{ background: "var(--muted-bg)", color: "var(--ink)" }}
                    >
                      Clear debt
                    </button>
                  )}

                  {isGuest ? (
                    <button
                      onClick={() => setPromoteId(promoteId === s.id ? null : s.id)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0"
                      style={{ background: "var(--accent-soft)", color: "var(--accent-dark)" }}
                    >
                      Make resident
                    </button>
                  ) : (
                    <button
                      onClick={() => makeGuest(s.id, s.name)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0"
                      style={{ background: "var(--muted-bg)", color: "var(--ink)" }}
                    >
                      Make guest
                    </button>
                  )}

                  <button
                    onClick={() => deleteMember(s.id, s.name)}
                    className="flex items-center justify-center w-9 h-9 rounded-xl hover:opacity-70 transition-colors shrink-0"
                    style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {promoteId === s.id && (
                    <form onSubmit={makeResident} className="w-full flex flex-col gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <TextField
                          type="password"
                          value={promotePin}
                          onChange={e => setPromotePin(e.target.value)}
                          placeholder="Set a PIN for this resident"
                          maxLength={PIN_MAX_LENGTH}
                          pattern={PIN_PATTERN}
                          title={PIN_INVALID_MESSAGE}
                          icon={<KeyRound className="w-4 h-4" />}
                        />
                        <button type="submit" disabled={!promotePin} className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm shrink-0">
                          Confirm
                        </button>
                      </div>
                      {promoteError && <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{promoteError}</p>}
                    </form>
                  )}

                  {editId === s.id && (
                    <form onSubmit={saveMemberEdit} className="w-full flex flex-col gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <TextField
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Name"
                          icon={<User className="w-4 h-4" />}
                          autoFocus
                        />
                        {!isGuest && (
                          <TextField
                            type="password"
                            value={editPin}
                            onChange={e => setEditPin(e.target.value)}
                            placeholder="New PIN (optional)"
                            maxLength={PIN_MAX_LENGTH}
                            pattern={editPin ? PIN_PATTERN : undefined}
                            title={PIN_INVALID_MESSAGE}
                            icon={<KeyRound className="w-4 h-4" />}
                          />
                        )}
                        <button type="submit" disabled={!editName.trim()} className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm shrink-0">
                          Save
                        </button>
                      </div>
                      {editError && <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{editError}</p>}
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Entries */}
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "var(--muted)" }}>
            Recent entries
          </p>
          <div className="card rounded-2xl overflow-hidden">
            {entriesLoading ? (
              <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
            ) : entries.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>No entries yet.</p>
            ) : entries.map((e, i) => {
              const isTea = e.taskType !== "other"
              return (
                <div
                  key={e.id}
                  className={`flex items-center gap-3 px-5 py-3 ${i < entries.length - 1 ? "border-b" : ""}`}
                  style={{ borderColor: "var(--border)", opacity: e.invalid ? 0.5 : 1 }}
                >
                  {isTea ? <Coffee className="w-4 h-4 shrink-0" style={{ color: "var(--muted)" }} /> : <Briefcase className="w-4 h-4 shrink-0" style={{ color: "var(--muted)" }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
                      {e.makerName} {isTea ? "made tea" : `did: ${e.taskLabel || "a job"}`}
                      {e.invalid && <span className="ml-1.5 text-xs font-semibold" style={{ color: "var(--danger)" }}>· invalid</span>}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(e.madeAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {e.loggerName !== e.makerName && ` · logged by ${e.loggerName}`}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleEntryValid(e.id, !e.invalid)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0"
                    style={{
                      background: e.invalid ? "var(--success-bg)" : "var(--danger-bg)",
                      color: e.invalid ? "var(--success-dark)" : "var(--danger-dark)",
                    }}
                  >
                    {e.invalid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    {e.invalid ? "Restore" : "Invalidate"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Archive old entries */}
          <div className="card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              <Archive className="w-3.5 h-3.5" />
              Archive old entries
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
              Purges entries before a date to shrink the DB. Each member's net debt from those entries is preserved as a balance adjustment — standings don't change.
              {safeCutoffStr && (
                <> Pre-filled to the safest date — everyone's most recent entry stays intact.</>
              )}
            </p>
            <form onSubmit={runArchive} className="flex items-center gap-2">
              <TextField type="date" value={archiveDate} onChange={e => setArchiveDate(e.target.value)} />
              <button type="submit" disabled={archiving || !archiveDate} className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm shrink-0">
                {archiving ? "Working…" : "Neutralize"}
              </button>
            </form>
            {archiveResult && <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>{archiveResult}</p>}
          </div>

          {/* DB health */}
          <div className="card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] mb-3 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              <Database className="w-3.5 h-3.5" />
              Database health
            </p>
            {healthLoading ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
            ) : !health ? (
              <p className="text-sm" style={{ color: "var(--danger)" }}>Failed to load.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-1.5" style={{ color: health.connected ? "var(--success-dark)" : "var(--danger)" }}>
                  <Activity className="w-3.5 h-3.5" />
                  {health.connected ? `Connected · ${health.pingMs}ms` : "Disconnected"}
                </p>
                <p style={{ color: "var(--ink)" }}>Total size: <span className="font-semibold">{formatBytes(health.dbSizeBytes)}</span></p>
                <div className="text-xs space-y-0.5" style={{ color: "var(--muted)" }}>
                  {health.tables.slice(0, 5).map((t) => (
                    <div key={t.table} className="flex justify-between">
                      <span>{t.table}</span>
                      <span className="tabular">{formatBytes(t.sizeBytes)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs pt-1" style={{ color: "var(--muted)" }}>
                  {health.counts.members} members · {health.counts.sessions} sessions · {health.counts.drinks} drinks · {health.counts.adjustments} adjustments
                </p>
                <p className="text-[11px] pt-1" style={{ color: "var(--muted)" }}>{health.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
