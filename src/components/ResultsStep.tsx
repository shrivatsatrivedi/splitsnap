import { useState } from 'react'
import { motion } from 'framer-motion'
import { computeSplit, money } from '../lib/split'
import type { BillItem, Person, Assignments, Charges } from '../types'
import { Button } from './ui'

export default function ResultsStep({
  items, people, assignments, charges, onBack, onReset, onFixUnassigned,
}: {
  items: BillItem[]
  people: Person[]
  assignments: Assignments
  charges: Charges
  onBack: () => void
  onReset: () => void
  onFixUnassigned: () => void
}) {
  const r = computeSplit(items, people, assignments, charges)
  const [open, setOpen] = useState<string | null>(null)

  const copySummary = () => {
    const lines = [
      'SplitSnap — bill split',
      ...r.shares
        .filter((s) => s.total > 0)
        .map((s) => `${s.person.name}: ${money(s.total)}`),
      `Total: ${money(r.grandTotal)}`,
    ]
    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {})
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-2xl font-bold">The split 🎉</h2>
        <p className="text-white/50 text-sm mt-1">
          Total to divide <span className="text-white font-bold">{money(r.grandTotal)}</span>
        </p>
      </div>

      {r.unassigned > 0.01 && (
        <div className="mb-4 glass rounded-2xl p-3 border border-amber-400/30 bg-amber-400/5">
          <p className="text-amber-300/90 text-xs">
            {money(r.unassigned)} of items isn't assigned to anyone, so it's not in the split below.
          </p>
          <button onClick={onFixUnassigned} className="mt-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200">
            Split the rest equally among everyone →
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-1">
        {r.shares.map((s, i) => (
          <motion.div
            key={s.person.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl overflow-hidden"
          >
            <button onClick={() => setOpen(open === s.person.id ? null : s.person.id)} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full font-bold" style={{ background: s.person.color }}>
                  {s.person.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold">{s.person.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: s.person.color }}>{money(s.total)}</div>
                <div className="text-xs text-white/40">{open === s.person.id ? 'hide' : 'breakdown'}</div>
              </div>
            </button>
            {open === s.person.id && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-4 pb-4 text-sm overflow-hidden">
                <div className="border-t border-white/10 pt-3 space-y-1">
                  {s.lines.map((l, j) => (
                    <div key={j} className="flex justify-between text-white/60">
                      <span className="truncate pr-2">
                        {l.name}
                        {l.totalWeight > l.weight && (
                          <span className="text-white/35"> · {l.weight}/{l.totalWeight} share</span>
                        )}
                      </span>
                      <span className="tabular-nums">{money(l.amount)}</span>
                    </div>
                  ))}
                  {s.lines.length === 0 && <div className="text-white/30">Nothing assigned</div>}
                  <div className="flex justify-between text-white/40 pt-1.5 border-t border-white/5 mt-1.5">
                    <span>Items subtotal</span><span className="tabular-nums">{money(s.subtotal)}</span>
                  </div>
                  {s.discount > 0 && <div className="flex justify-between text-emerald-400/70"><span>Discount</span><span className="tabular-nums">−{money(s.discount)}</span></div>}
                  {s.service > 0 && <div className="flex justify-between text-white/40"><span>Service</span><span className="tabular-nums">{money(s.service)}</span></div>}
                  {s.gst > 0 && <div className="flex justify-between text-white/40"><span>GST</span><span className="tabular-nums">{money(s.gst)}</span></div>}
                  <div className="flex justify-between font-semibold text-white pt-1.5 border-t border-white/10 mt-1.5">
                    <span>Their total</span><span className="tabular-nums">{money(s.total)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-5 glass rounded-2xl p-4 text-sm space-y-1.5">
        <div className="flex justify-between text-white/60"><span>Assigned items</span><span className="tabular-nums">{money(r.assignedSubtotal)}</span></div>
        {r.discountTotal > 0 && <div className="flex justify-between text-emerald-400/70"><span>Discount</span><span className="tabular-nums">−{money(r.discountTotal)}</span></div>}
        {r.serviceTotal > 0 && <div className="flex justify-between text-white/60"><span>Service charge</span><span className="tabular-nums">{money(r.serviceTotal)}</span></div>}
        {r.gstTotal > 0 && <div className="flex justify-between text-white/60"><span>GST</span><span className="tabular-nums">{money(r.gstTotal)}</span></div>}
        <div className="flex justify-between font-bold pt-2 border-t border-white/10 text-base"><span>Grand total</span><span className="tabular-nums">{money(r.grandTotal)}</span></div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <button onClick={copySummary} className="text-xs text-cyan-300 hover:text-cyan-200 glass rounded-full px-4 py-2">
          📋 Copy summary
        </button>
      </div>

      <div className="mt-5 flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button variant="soft" onClick={onReset}>↺ New bill</Button>
      </div>
    </div>
  )
}
