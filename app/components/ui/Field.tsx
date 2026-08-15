"use client"

import { forwardRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode
  error?: boolean
}

export const TextField = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border px-3.5 transition-all"
        style={{
          borderColor: error ? "var(--danger)" : focused ? "var(--accent)" : "var(--border)",
          background: "var(--surface)",
          boxShadow: focused ? `0 0 0 3px ${error ? "var(--danger-bg)" : "var(--accent-soft)"}` : "none",
        }}
      >
        {icon && <span className="shrink-0 flex items-center" style={{ color: "var(--muted)" }}>{icon}</span>}
        <input
          ref={ref}
          className={cn("w-full bg-transparent py-2.5 text-sm focus:outline-none", className)}
          style={{ color: "var(--ink)", ...style }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          {...props}
        />
      </div>
    )
  }
)
TextField.displayName = "TextField"

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: React.ReactNode
}

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(
  ({ icon, className, children, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border px-3.5 transition-all"
        style={{
          borderColor: focused ? "var(--accent)" : "var(--border)",
          background: "var(--surface)",
          boxShadow: focused ? "0 0 0 3px var(--accent-soft)" : "none",
        }}
      >
        {icon && <span className="shrink-0 flex items-center" style={{ color: "var(--muted)" }}>{icon}</span>}
        <select
          ref={ref}
          className={cn("w-full bg-transparent py-2.5 text-sm focus:outline-none appearance-none cursor-pointer", className)}
          style={{ color: "var(--ink)", ...style }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="w-4 h-4 shrink-0 pointer-events-none" style={{ color: "var(--muted)" }} />
      </div>
    )
  }
)
SelectField.displayName = "SelectField"
