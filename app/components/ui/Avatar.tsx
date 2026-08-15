import { cn } from "@/lib/utils"

const COLORS = [
  "bg-amber-100 text-amber-900",
  "bg-emerald-100 text-emerald-900",
  "bg-blue-100 text-blue-900",
  "bg-rose-100 text-rose-900",
  "bg-violet-100 text-violet-900",
  "bg-orange-100 text-orange-900",
]

function colorForName(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % COLORS.length
  return COLORS[hash]
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.slice(0, 2).toUpperCase()
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold shrink-0",
        colorForName(name),
        size === "sm" && "w-7 h-7 text-xs",
        size === "md" && "w-10 h-10 text-sm",
        size === "lg" && "w-14 h-14 text-lg"
      )}
    >
      {initials}
    </div>
  )
}
