// Radix Colors step-9 solids (radix-ui.com/colors) — documented white-text-safe,
// and identical hex across light/dark themes, so one palette covers both.
const AVATAR_COLORS = [
  ["#0090FF", "#FFFFFF"], // blue
  ["#8E4EC6", "#FFFFFF"], // purple
  ["#12A594", "#FFFFFF"], // teal
  ["#A18072", "#FFFFFF"], // bronze
  ["#AB4ABA", "#FFFFFF"], // plum
  ["#00A2C7", "#FFFFFF"], // cyan
]

export function avatarColor(name: string): [string, string] {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h] as [string, string]
}
