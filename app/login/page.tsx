"use client"

import { useState, useEffect } from "react"
import { KeyRound, ArrowRight, Loader2 } from "lucide-react"
import { TextField } from "@/app/components/ui/Field"
import { avatarColor } from "@/app/components/ui/avatarColor"

type Member = { id: string; name: string }

export default function LoginPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [memberId, setMemberId] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch("/api/members")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setMembers(data); setFetching(false) })
      .catch(() => { setMembers([]); setFetching(false) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, pin }),
    })
    setLoading(false)
    if (res.ok) {
      window.location.href = "/"
    } else {
      const data = await res.json()
      setError(data.error === "Wrong PIN" ? "Wrong PIN. Try again or ask your admin." : (data.error ?? "Login failed"))
      setPin("")
    }
  }

  const selected = members.find((m) => m.id === memberId)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="gradient-hero w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl">
            🍵
          </div>
          <h1 className="font-display text-2xl" style={{ color: "var(--ink)" }}>Chai Pe Charcha</h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--muted)" }}>Fair chai rotation for your flat</p>
        </div>

        <div className="card rounded-2xl p-6">
          {fetching ? (
            <div className="flex items-center justify-center gap-2 py-8" style={{ color: "var(--muted)" }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading members…</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--muted)" }}>
              <p className="text-sm font-medium">No members yet.</p>
              <p className="text-sm mt-1">Ask your admin to add you.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Who are you?</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {members.map((m) => {
                    const [bg, fg] = avatarColor(m.name)
                    const isSelected = memberId === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setMemberId(m.id); setError("") }}
                        className="flex flex-col items-center gap-2 py-3 px-1.5 rounded-xl border transition-colors"
                        style={{
                          borderColor: isSelected ? "var(--accent)" : "var(--border)",
                          background: isSelected ? "var(--accent-soft)" : "var(--surface)",
                        }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: bg, color: fg }}>
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-center leading-tight truncate w-full" style={{ color: isSelected ? "var(--accent-dark)" : "var(--ink)" }}>
                          {m.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {memberId && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "var(--muted)" }}>
                      PIN for {selected?.name}
                    </label>
                    <TextField
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter your PIN"
                      maxLength={20}
                      autoFocus
                      icon={<KeyRound className="w-4 h-4" />}
                      error={!!error}
                      className="tracking-widest font-medium"
                      required
                    />
                    {error && <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--danger)" }}>{error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !pin}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
