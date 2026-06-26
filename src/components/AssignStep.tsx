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
  const assignedQty = (itemId: string) =>
    Object.values(assignments[itemId] || {}).reduce((s, q) => s + q, 0)

  const setQty = (itemId: string, personId: string, q: number) => {
    const next = { ...assignments, [itemId]: { ...(assignments[itemId] || {}) } }
    if (q <= 0) delete next[itemId][personId]
    else next[itemId][personId] = q
    setAssignments(next)
  }

  const splitEqually = (item: BillItem) => {
    const each = item.qty / people.length
    const map: Record<string, number> = {}
    people.forEach((p) => (map[p.id] = each))
    setAssignments({ ...assignments, [item.id]: map })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Who ate what?</h2>
      <p className="text-white/50 text-sm mt-1 mb-5">
        Tap a person to add their share, or split an item equally. Fractions are fine.
      </p>

      <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
        {items.map((item) => {
          const used = assignedQty(item.id)
          const left = +(item.qty - used).toFixed(2)
          return (
            <motion.div key={item.id} layout className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold">{item.name || 'Unnamed'}</span>
                  <span className="text-white/40 text-sm ml-2">{item.qty} × {money(item.price)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${Math.abs(left) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {Math.abs(left) < 0.01 ? '✓ assigned' : `${left} left`}
                  </span>
                  <button onClick={() => splitEqually(item)} className="text-xs text-cyan-300 hover:text-cyan-200">
                    Split equally
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {people.map((p) => {
                  const q = assignments[item.id]?.[p.id] || 0
                  const active = q > 0
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-full pl-1 pr-1.5 py-1 transition-all"
                      style={{
                        background: active ? p.color + '33' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? p.color + '88' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <button
                        onClick={() => setQty(item.id, p.id, q + 1)}
                        className="flex items-center gap-1.5 text-sm font-medium"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ background: p.color }}>
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        {p.name}
                      </button>
                      {active && (
                        <div className="flex items-center gap-1 ml-1">
                          <button onClick={() => setQty(item.id, p.id, +(q - 1).toFixed(2))} className="h-5 w-5 rounded-full bg-white/10 hover:bg-white/20 text-xs">−</button>
                          <span className="text-xs font-bold w-6 text-center">{q % 1 === 0 ? q : q.toFixed(2)}</span>
                          <button onClick={() => setQty(item.id, p.id, q + 1)} className="h-5 w-5 rounded-full bg-white/10 hover:bg-white/20 text-xs">+</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext}>See the split →</Button>
      </div>
    </div>
  )
}
