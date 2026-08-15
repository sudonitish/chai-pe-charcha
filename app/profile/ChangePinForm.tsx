"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, KeyRound, LogOut, CheckCircle2 } from "lucide-react"
import { PIN_PATTERN, PIN_MAX_LENGTH, PIN_INVALID_MESSAGE } from "@/lib/pin"
import { TextField } from "@/app/components/ui/Field"

export function ChangePinForm({ name }: { name: string }) {
  const router = useRouter()
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setSaving(true)
    const res = await fetch("/api/auth/change-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin, newPin }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Something went wrong")
      return
    }
    setCurrentPin("")
    setNewPin("")
    setSuccess(true)
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <>
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3">
          <a href="/" className="card flex items-center justify-center w-9 h-9 rounded-xl hover:opacity-70 transition-colors" style={{ color: "var(--ink)" }}>
            <ArrowLeft className="w-4 h-4" />
          </a>
          <span className="font-display text-lg" style={{ color: "var(--ink)" }}>{name}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-colors px-3 py-1.5 rounded-full"
          style={{ color: "var(--muted)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Log out
        </button>
      </header>

      <div className="card rounded-3xl px-6 pt-6 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide mb-4 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
          <KeyRound className="w-3.5 h-3.5" />
          Change PIN
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <TextField
            type="password"
            inputMode="text"
            placeholder="Current PIN"
            value={currentPin}
            maxLength={PIN_MAX_LENGTH}
            onChange={(e) => setCurrentPin(e.target.value)}
            required
          />
          <TextField
            type="password"
            inputMode="text"
            placeholder="New PIN"
            value={newPin}
            pattern={PIN_PATTERN}
            maxLength={PIN_MAX_LENGTH}
            title={PIN_INVALID_MESSAGE}
            onChange={(e) => setNewPin(e.target.value)}
            required
          />

          {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
          {success && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--success)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> PIN updated
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Update PIN"}
          </button>
        </form>
      </div>
    </>
  )
}
