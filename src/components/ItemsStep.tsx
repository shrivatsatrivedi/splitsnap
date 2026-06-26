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
  const num = (v: string) => Math.max(0, parseFloat(v) || 0)

  // Live preview mirroring the real split math (on the full subtotal here).
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discountAmt =
    charges.discountType === 'percent' ? (subtotal * charges.discount) / 100 : Math.min(charges.discount, subtotal)
  const discounted = subtotal - discountAmt
  const service = (discounted * charges.serviceChargePercent) / 100
  const taxBase = charges.taxOnService ? discounted + service : discounted
  const gst = (taxBase * charges.gstPercent) / 100
  const grand = discounted + service + gst

  return (
    <div>
      <h2 className="text-2xl font-bold">Review the items</h2>
      <p className="text-white/50 text-sm mt-1 mb-5">
        Scanning isn't perfect — tweak names, quantities and prices, or add anything missing.
      </p>

      <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
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
              <span className="text-white/40 text-xs">×</span>
              <input
                type="number" min="1" inputMode="numeric" value={it.qty}
                onChange={(e) => update(it.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-12 bg-white/5 rounded-lg px-2 py-1.5 text-center text-sm outline-none focus:ring-1 ring-cyan-400"
              />
              <div className="flex items-center bg-white/5 rounded-lg px-2 focus-within:ring-1 ring-cyan-400">
                <span className="text-white/40 text-sm">₹</span>
                <input
                  type="number" min="0" step="0.01" inputMode="decimal" value={it.price}
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

      {/* Charges */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-3">
          <label className="text-xs text-white/50">GST %</label>
          <input
            type="number" min="0" step="0.01" inputMode="decimal" value={charges.gstPercent}
            onChange={(e) => setCharges({ ...charges, gstPercent: num(e.target.value) })}
            className="w-full bg-transparent outline-none text-lg font-bold mt-1"
          />
        </div>
        <div className="glass rounded-2xl p-3">
          <label className="text-xs text-white/50">Service charge %</label>
          <input
            type="number" min="0" step="0.01" inputMode="decimal" value={charges.serviceChargePercent}
            onChange={(e) => setCharges({ ...charges, serviceChargePercent: num(e.target.value) })}
            className="w-full bg-transparent outline-none text-lg font-bold mt-1"
          />
        </div>
        <div className="glass rounded-2xl p-3 col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/50">Discount</label>
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              {(['flat', 'percent'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCharges({ ...charges, discountType: t })}
                  className={`px-2.5 py-1 text-xs font-semibold ${charges.discountType === t ? 'bg-cyan-500/30 text-cyan-200' : 'text-white/40'}`}
                >
                  {t === 'flat' ? '₹' : '%'}
                </button>
              ))}
            </div>
          </div>
          <input
            type="number" min="0" step="0.01" inputMode="decimal" value={charges.discount}
            onChange={(e) => setCharges({ ...charges, discount: num(e.target.value) })}
            className="w-full bg-transparent outline-none text-lg font-bold mt-1"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-white/50 cursor-pointer select-none">
        <input
          type="checkbox" checked={charges.taxOnService}
          onChange={(e) => setCharges({ ...charges, taxOnService: e.target.checked })}
          className="accent-cyan-500"
        />
        Apply GST on top of the service charge (typical on Indian restaurant bills)
      </label>

      {/* Live total preview */}
      <div className="mt-5 glass rounded-2xl p-4 text-sm space-y-1.5">
        <div className="flex justify-between text-white/50"><span>Subtotal</span><span className="tabular-nums">{money(subtotal)}</span></div>
        {discountAmt > 0 && <div className="flex justify-between text-emerald-400/70"><span>Discount</span><span className="tabular-nums">−{money(discountAmt)}</span></div>}
        {service > 0 && <div className="flex justify-between text-white/50"><span>Service charge</span><span className="tabular-nums">{money(service)}</span></div>}
        {gst > 0 && <div className="flex justify-between text-white/50"><span>GST</span><span className="tabular-nums">{money(gst)}</span></div>}
        <div className="flex justify-between font-bold pt-2 border-t border-white/10 text-base"><span>Bill total</span><span className="tabular-nums">{money(grand)}</span></div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={items.length === 0}>Next: People →</Button>
      </div>
    </div>
  )
}
