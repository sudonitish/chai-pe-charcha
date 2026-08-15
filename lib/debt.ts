export type MemberStats = {
  id: string
  name: string
  joinedAt: Date
  role: string
  totalDrinks: number
  totalMakes: number
  debt: number
  lastMadeAt: Date | null
  rank: number
}

type RawMember = {
  id: string
  name: string
  joinedAt: Date
  role: string
  lastMadeAt: Date | null
  sessionsMade: { madeAt: Date }[]
  drinks: { sessionId: string }[]
  adjustments?: { delta: number }[]
}

// The members-with-stats API route returns dates as JSON strings — this
// restores Date instances so calculateDebts' comparisons work.
export function parseMembersJson(raw: unknown[]): RawMember[] {
  return (raw as Array<Omit<RawMember, "joinedAt" | "lastMadeAt" | "sessionsMade"> & { joinedAt: string; lastMadeAt: string | null; sessionsMade: { madeAt: string }[] }>).map((m) => ({
    ...m,
    joinedAt: new Date(m.joinedAt),
    lastMadeAt: m.lastMadeAt ? new Date(m.lastMadeAt) : null,
    sessionsMade: m.sessionsMade.map((s) => ({ madeAt: new Date(s.madeAt) })),
  }))
}

export function calculateDebts(members: RawMember[]): MemberStats[] {
  const stats = members.map((m) => {
    const totalMakes = m.sessionsMade.length
    const totalDrinks = m.drinks.length
    const adjustmentTotal = (m.adjustments ?? []).reduce((sum, a) => sum + a.delta, 0)
    const debt = totalDrinks - totalMakes + adjustmentTotal

    // Durable field, not derived from sessionsMade — survives archiving old
    // session rows, so the rotation tie-break never gets corrupted by cleanup.
    return { id: m.id, name: m.name, joinedAt: m.joinedAt, role: m.role, totalDrinks, totalMakes, debt, lastMadeAt: m.lastMadeAt }
  })

  stats.sort((a, b) => {
    if (b.debt !== a.debt) return b.debt - a.debt
    if (a.lastMadeAt === null && b.lastMadeAt === null) return a.joinedAt.getTime() - b.joinedAt.getTime()
    if (a.lastMadeAt === null) return -1
    if (b.lastMadeAt === null) return 1
    return a.lastMadeAt.getTime() - b.lastMadeAt.getTime()
  })

  return stats.map((s, i) => ({ ...s, rank: i + 1 }))
}
