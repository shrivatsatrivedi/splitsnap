import type { BillItem, Person, Assignments, Charges } from '../types'

export interface PersonShare {
  person: Person
  subtotal: number
  gst: number
  service: number
  discount: number
  total: number
  lines: { name: string; qty: number; amount: number }[]
}

export interface SplitResult {
  itemsTotal: number
  gstTotal: number
  serviceTotal: number
  discountTotal: number
  grandTotal: number
  shares: PersonShare[]
  unassigned: number // value of item-qty not assigned to anyone
}

export function computeSplit(
  items: BillItem[],
  people: Person[],
  assignments: Assignments,
  charges: Charges,
): SplitResult {
  const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  // per-person subtotal from assignments
  const subtotals: Record<string, number> = {}
  const lines: Record<string, PersonShare['lines']> = {}
  people.forEach((p) => { subtotals[p.id] = 0; lines[p.id] = [] })

  let assignedValue = 0
  for (const item of items) {
    const a = assignments[item.id] || {}
    for (const p of people) {
      const q = a[p.id] || 0
      if (q > 0) {
        const amt = q * item.price
        subtotals[p.id] += amt
        assignedValue += amt
        lines[p.id].push({ name: item.name, qty: q, amount: amt })
      }
    }
  }

  const unassigned = Math.max(0, itemsTotal - assignedValue)

  const gstTotal = (itemsTotal * charges.gstPercent) / 100
  const serviceTotal = (itemsTotal * charges.serviceChargePercent) / 100
  const discountTotal = Math.min(charges.discount, itemsTotal + gstTotal + serviceTotal)
  const grandTotal = itemsTotal + gstTotal + serviceTotal - discountTotal

  const base = assignedValue || 1 // avoid /0; charges shared by consumption ratio
  const shares: PersonShare[] = people.map((p) => {
    const ratio = (subtotals[p.id] || 0) / base
    const gst = gstTotal * ratio
    const service = serviceTotal * ratio
    const discount = discountTotal * ratio
    const total = subtotals[p.id] + gst + service - discount
    return {
      person: p,
      subtotal: subtotals[p.id],
      gst, service, discount, total,
      lines: lines[p.id],
    }
  })

  return { itemsTotal, gstTotal, serviceTotal, discountTotal, grandTotal, shares, unassigned }
}

export const money = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
