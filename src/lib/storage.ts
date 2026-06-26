import type { SplitResult } from './split'

export interface HistoryEntry {
  id: string
  date: number
  grandTotal: number
  peopleCount: number
  itemCount: number
  names: string[]
}

const KEY = 'splitsnap.history.v1'

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveSplit(result: SplitResult, itemCount: number): void {
  const entry: HistoryEntry = {
    id: Math.random().toString(36).slice(2, 10),
    date: Date.now(),
    grandTotal: result.grandTotal,
    peopleCount: result.shares.length,
    itemCount,
    names: result.shares.map((s) => s.person.name),
  }
  const next = [entry, ...getHistory()].slice(0, 10)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

export function clearHistory(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
