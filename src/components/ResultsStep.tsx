import { useState } from 'react'
import { motion } from 'framer-motion'
import { computeSplit, money } from '../lib/split'
import type { BillItem, Person, Assignments, Charges } from '../types'
import { Button } from './ui'

export default function ResultsStep({
  items, people, assignments, charges, onBack, onReset,
}: {
  items: BillItem[]
  people: Person[]
  assignments: Assignments
  charges: Charges
  onBack: () => void
  onReset: () => void
}) {
  const r = computeSplit(items, people, assignments, charges)
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">The split 🎉</h2>
        <p className="text-white/50 text-sm mt-1">Grand total <span className="text-white font-bold">{money(r.grandTotal)}</span></p>
        {r.unassigned > 0.01 && (
          <p className="text-amber-400 text-xs mt-2">
            ⚠ {money(r.unassigned)} of items wasn't assigned to anyone — those costs aren't included below.
          </p>
        )}
      </div>

      <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
        {r.shares.map((s, i) => (
          <motion.div
            key={s.person.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
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
                      <span>{l.name} × {l.qty % 1 === 0 ? l.qty : l.qty.toFixed(2)}</span>
                      <span>{money(l.amount)}</span>
                    </div>
                  ))}
                  {s.lines.length === 0 && <div className="text-white/30">Nothing assigned</div>}
                  <div className="flex justify-between text-white/40 pt-1"><span>GST share</span><span>{money(s.gst)}</span></div>
                  {s.service > 0 && <div className="flex justify-between text-white/40"><span>Service</span><span>{money(s.service)}</span></div>}
                  {s.discount > 0 && <div className="flex justify-between text-emerald-400/70"><span>Discount</span><span>−{money(s.discount)}</span></div>}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-5 glass rounded-2xl p-4 text-sm space-y-1.5">
        <div className="flex justify-between text-white/60"><span>Items</span><span>{money(r.itemsTotal)}</span></div>
        <div className="flex justify-between text-white/60"><span>GST</span><span>{money(r.gstTotal)}</span></div>
        {r.serviceTotal > 0 && <div className="flex justify-between text-white/60"><span>Service charge</span><span>{money(r.serviceTotal)}</span></div>}
        {r.discountTotal > 0 && <div className="flex justify-between text-emerald-400/70"><span>Discount</span><span>−{money(r.discountTotal)}</span></div>}
        <div className="flex justify-between font-bold pt-2 border-t border-white/10 text-base"><span>Grand total</span><span>{money(r.grandTotal)}</span></div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button variant="soft" onClick={onReset}>↺ New bill</Button>
      </div>
    </div>
  )
}
