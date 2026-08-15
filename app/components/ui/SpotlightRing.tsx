"use client"

import { motion } from "framer-motion"

export function SpotlightRing({ initials, bg, fg, size = 84 }: { initials: string; bg: string; fg: string; size?: number }) {
  const ringWidth = Math.max(4, Math.round(size * 0.06))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* static accent base ring */}
      <div className="absolute inset-0 rounded-full" style={{ background: "var(--accent-soft)" }} />
      {/* rotating accent sweep on top for motion */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(from 0deg, var(--accent-solid), rgba(0,0,0,0) 45%, rgba(0,0,0,0) 55%, var(--accent-solid) 100%)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      />
      <div
        className="absolute rounded-full flex items-center justify-center font-bold"
        style={{
          inset: ringWidth,
          background: bg,
          color: fg,
          fontSize: size * 0.32,
        }}
      >
        {initials}
      </div>
    </div>
  )
}
