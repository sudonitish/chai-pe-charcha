import { Coffee, Check } from "lucide-react"

export function DebtCups({ debt }: { debt: number }) {
  if (debt === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full shrink-0"
        style={{ background: "var(--success-bg)", color: "var(--success-dark)" }}
      >
        <Check className="w-3 h-3" strokeWidth={2.5} /> Settled
      </span>
    )
  }

  const owes = debt > 0
  const count = Math.abs(debt)

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold tabular px-2 py-1 rounded-full shrink-0"
      style={{
        background: owes ? "var(--danger-bg)" : "var(--success-bg)",
        color: owes ? "var(--danger-dark)" : "var(--success-dark)",
      }}
      title={owes ? `Owes ${count} cup${count !== 1 ? "s" : ""}` : `${count} cup${count !== 1 ? "s" : ""} ahead`}
    >
      <Coffee className="w-3 h-3" strokeWidth={2.5} />
      {count}
    </span>
  )
}
