"use client"

import { Home, BarChart2, LogOut, LogIn } from "lucide-react"
import { usePathname } from "next/navigation"

type Me = { initials: string; bg: string; fg: string } | null

export function BottomNav({ me }: { me: Me }) {
  const pathname = usePathname()

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  const linkStyle = (active: boolean) => ({ color: active ? "var(--accent-dark)" : "var(--muted)" })

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-around py-2 px-4" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}>
        <a href="/" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors" style={linkStyle(pathname === "/")}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </a>
        <a href="/overview" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors" style={linkStyle(pathname === "/overview")}>
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Stats</span>
        </a>
        {me ? (
          <button onClick={handleSignOut} className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: me.bg, color: me.fg }}>
              {me.initials}
            </div>
            <span className="text-[10px] font-semibold flex items-center gap-0.5" style={{ color: "var(--muted)" }}>
              <LogOut className="w-2.5 h-2.5" /> Out
            </span>
          </button>
        ) : (
          <a href="/login" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl" style={{ color: "var(--accent-dark)" }}>
            <LogIn className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Sign in</span>
          </a>
        )}
      </div>
    </nav>
  )
}
