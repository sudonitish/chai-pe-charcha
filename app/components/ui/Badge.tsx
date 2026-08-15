import { cn } from "@/lib/utils"

type Variant = "default" | "success" | "danger" | "muted" | "amber"

const variants: Record<Variant, string> = {
  default: "bg-[var(--primary-light)] text-[var(--primary)]",
  success: "bg-[var(--success-bg)] text-[var(--success)]",
  danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
  muted: "bg-[var(--muted-bg)] text-[var(--text-muted)]",
  amber: "bg-[var(--amber-bg)] text-[var(--amber)]",
}

export function Badge({ children, variant = "default", className }: {
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tabular", variants[variant], className)}>
      {children}
    </span>
  )
}
