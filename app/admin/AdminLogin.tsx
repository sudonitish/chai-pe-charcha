"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Lock } from "lucide-react"
import { TextField } from "@/app/components/ui/Field"

export function AdminLogin() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) router.refresh()
    else setError("Wrong password")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "var(--accent-solid)" }}>
            <ShieldCheck className="w-7 h-7" style={{ color: "#fff" }} />
          </div>
          <h1 className="font-display text-2xl" style={{ color: "var(--ink)" }}>Admin Access</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Chai Pe Charcha · Admin Panel</p>
        </div>

        <div className="card rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <TextField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              icon={<Lock className="w-4 h-4" />}
              error={!!error}
            />
            {error && <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full py-3 rounded-xl font-semibold text-sm"
            >
              {loading ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
