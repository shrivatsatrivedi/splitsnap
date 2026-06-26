import { motion } from 'framer-motion'
import { money } from '../lib/split'
import type { BillItem, Person, Assignments } from '../types'
import { Button } from './ui'

export default function AssignStep({
  items, people, assignments, setAssignments, onNext, onBack,
}: {
  items: BillItem[]
  people: Person[]
  assignments: Assignments
  setAssignments: (a: Assignments) => void
  onNext: () => void
  onBack: () => void
}) {
  const weightsFor = (itemId: string) => assignments[itemId] || {}
  const totalWeight = (itemId: string) =>
    people.reduce((s, p) => s + (weightsFor(itemId)[p.id] || 0), 0)

  const setWeight = (itemId: string, personId: string, w: number) => {
    const next: Assignments = { ...assignments, [itemId]: { ...weightsFor(itemId) } }
    if (w <= 0) delete next[itemId][personId]
    else next[itemId][personId] = w
    setAssignments(next)
  }

  // Tap toggles whether a person shares the item (default weight 1).
  const toggle = (itemId: string, personId: string) => {
    const cur = weightsFor(itemId)[personId] || 0
    setWeight(itemId, personId, cur > 0 ? 0 : 1)
  }

  const setAllForItem = (item: BillItem, on: boolean) => {
    const next: Assignments = { ...assignments, [item.id]: {} }
    if (on) people.forEach((p) => (next[item.id][p.id] = 1))
    setAssignments(next)
  }

  const everyoneEverything = () => {
    const next: Assignments = {}
    items.forEach((it) => {
      next[it.id] = {}
      people.forEach((p) => (next[it.id][p.id] = 1))
    })
    setAssignments(next)
  }

  const assignedCount = items.filter((it) => totalWeight(it.id) > 0).length

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold">Who shared what?</h2>
        <p className="text-white/50 text-sm mt-1">
          Tap everyone who shared an item — its cost splits equally between them. Use −/+ for unequal portions.
        </p>
      </div>

      <button
        onClick={everyoneEverything}
        className="mt-3 mb-4 text-xs font-medium text-cyan-300 hover:text-cyan-200 glass rounded-full px-3 py-1.5"
      >
        ⚡ Everyone shared everything equally
      </button>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        {items.map((item) => {
          const cost = item.price * item.qty
          const tw = totalWeight(item.id)
          const sharers = people.filter((p) => (weightsFor(item.id)[p.id] || 0) > 0)
          const allEqual = sharers.length > 0 && sharers.every((p) => weightsFor(item.id)[p.id] === 1)
          return (
            <motion.div key={item.id} layout className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{item.name || 'Unnamed item'}</div>
                  <div className="text-white/40 text-xs">
                    {item.qty} × {money(item.price)} = {money(cost)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {tw > 0 ? (
                    <span className="text-xs text-emerald-300">
                      {allEqual
                        ? `Split ${sharers.length} way${sharers.length > 1 ? 's' : ''} · ${money(cost / sharers.length)} each`
                        : 'Custom split'}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400/90">Tap who shared it</span>
                  )}
                  <div className="mt-1 flex gap-2 justify-end">
                    <button onClick={() => setAllForItem(item, true)} className="text-[11px] text-cyan-300/80 hover:text-cyan-200">All</button>
                    {tw > 0 && <button onClick={() => setAllForItem(item, false)} className="text-[11px] text-white/30 hover:text-white/60">Clear</button>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {people.map((p) => {
                  const w = weightsFor(item.id)[p.id] || 0
                  const active = w > 0
                  const amt = active && tw > 0 ? (cost * w) / tw : 0
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-full pl-1 pr-1.5 py-1 transition-all select-none"
                      style={{
                        background: active ? p.color + '33' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? p.color + '99' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <button onClick={() => toggle(item.id, p.id)} className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ background: p.color }}>
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        <span className={active ? '' : 'text-white/60'}>{p.name}</span>
                      </button>
                      {active && (
                        <>
                          <span className="text-xs font-semibold tabular-nums" style={{ color: p.color }}>{money(amt)}</span>
                          <div className="flex items-center gap-0.5 ml-0.5">
                            <button
                              onClick={() => setWeight(item.id, p.id, Math.max(0, w - 1))}
                              className="h-5 w-5 rounded-full bg-black/20 hover:bg-black/40 text-xs leading-none"
                              title="Smaller portion"
                            >−</button>
                            {w > 1 && <span className="text-[10px] text-white/50 w-3 text-center">{w}</span>}
                            <button
                              onClick={() => setWeight(item.id, p.id, w + 1)}
                              className="h-5 w-5 rounded-full bg-black/20 hover:bg-black/40 text-xs leading-none"
                              title="Bigger portion"
                            >+</button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-4 text-center text-xs text-white/40">
        {assignedCount} of {items.length} items assigned
        {assignedCount < items.length && ' · unassigned items are left out of the split'}
      </div>

      <div className="mt-5 flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={assignedCount === 0}>See the split →</Button>
      </div>
    </div>
  )
}
