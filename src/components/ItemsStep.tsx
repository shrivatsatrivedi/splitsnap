import { motion, AnimatePresence } from 'framer-motion'
import { uid } from '../lib/id'
import { money } from '../lib/split'
import type { BillItem, Charges } from '../types'
import { Button } from './ui'

export default function ItemsStep({
  items, setItems, charges, setCharges, onNext, onBack,
}: {
  items: BillItem[]
  setItems: (i: BillItem[]) => void
  charges: Charges
  setCharges: (c: Charges) => void
  onNext: () => void
  onBack: () => void
}) {
  const update = (id: string, patch: Partial<BillItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id: string) => setItems(items.filter((it) => it.id !== id))
  const add = () => setItems([...items, { id: uid(), name: '', qty: 1, price: 0 }])

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const num = (v: string) => Math.max(0, parseFloat(v) || 0)

  return (
    <div>
      <h2 className="text-2xl font-bold">Review the items</h2>
      <p className="text-white/50 text-sm mt-1 mb-5">
        Scanning isn't perfect — tweak names, quantities and prices, or add anything missing.
      </p>

      <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="glass rounded-2xl p-3 flex items-center gap-2"
            >
              <input
                value={it.name}
                placeholder="Item name"
                onChange={(e) => update(it.id, { name: e.target.value })}
                className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-white/30 min-w-0"
              />
              <div className="flex items-center gap-1 text-white/40 text-xs">×</div>
              <input
                type="number" min="1" value={it.qty}
                onChange={(e) => update(it.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-12 bg-white/5 rounded-lg px-2 py-1.5 text-center text-sm outline-none focus:ring-1 ring-cyan-400"
              />
              <div className="flex items-center bg-white/5 rounded-lg px-2 focus-within:ring-1 ring-cyan-400">
                <span className="text-white/40 text-sm">₹</span>
                <input
                  type="number" min="0" step="0.01" value={it.price}
                  onChange={(e) => update(it.id, { price: num(e.target.value) })}
                  className="w-20 bg-transparent px-1 py-1.5 text-sm outline-none"
                />
              </div>
              <button onClick={() => remove(it.id)} className="text-white/30 hover:text-red-400 px-1 text-lg leading-none">×</button>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className="text-center py-8 text-white/40 text-sm">No items yet — add them below.</div>
        )}
      </div>

      <button onClick={add} className="mt-3 text-sm text-cyan-300 hover:text-cyan-200 font-medium">+ Add item</button>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {([
          ['GST %', 'gstPercent'],
          ['Service %', 'serviceChargePercent'],
          ['Discount ₹', 'discount'],
        ] as const).map(([label, key]) => (
          <div key={key} className="glass rounded-2xl p-3">
            <label className="text-xs text-white/50">{label}</label>
            <input
              type="number" min="0" step="0.01"
              value={charges[key]}
              onChange={(e) => setCharges({ ...charges, [key]: num(e.target.value) })}
              className="w-full bg-transparent outline-none text-lg font-bold mt-1"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-white/50">Items subtotal</span>
        <span className="font-bold text-lg">{money(total)}</span>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={items.length === 0}>Next: People →</Button>
      </div>
    </div>
  )
}
