import type { BillItem, Person, Assignments, Charges } from '../types'

export interface ShareLine {
  itemId: string
  name: string
  weight: number      // this person's weight on the item
  totalWeight: number // sum of weights on the item
  amount: number      // this person's pre-tax share of the item
}

export interface PersonShare {
  person: Person
  subtotal: number   // pre-tax, pre-discount
  discount: number
  service: number
  gst: number
  total: number
  lines: ShareLine[]
}

export interface SplitResult {
  itemsSubtotal: number    // every item's cost
  assignedSubtotal: number // cost of items that have at least one sharer
  unassigned: number       // cost of items nobody is assigned to
  discountTotal: number
  serviceTotal: number
  gstTotal: number
  grandTotal: number       // total for the ASSIGNED portion (what gets split)
  shares: PersonShare[]
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export const itemCost = (i: BillItem) => round2(i.price * i.qty)

// Largest-remainder rounding: round each value to 2dp so the rounded values
// sum exactly to round2(target). Distributes leftover paise deterministically
// to the largest fractional parts.
function roundToTarget(values: number[], target: number): number[] {
  if (values.length === 0) return []
  const floors = values.map((v) => Math.floor(v * 100))
  const used = floors.reduce((a, b) => a + b, 0)
  const targetCents = Math.round(target * 100)
  let leftover = targetCents - used
  const order = values
    .map((v, i) => ({ i, frac: v * 100 - Math.floor(v * 100) }))
    .sort((a, b) => b.frac - a.frac)
  const out = [...floors]
  for (let k = 0; k < order.length && leftover > 0; k++, leftover--) {
    out[order[k].i] += 1
  }
  for (let k = order.length - 1; k >= 0 && leftover < 0; k--, leftover++) {
    out[order[k].i] -= 1
  }
  return out.map((c) => c / 100)
}

export function computeSplit(
  items: BillItem[],
  people: Person[],
  assignments: Assignments,
  charges: Charges,
): SplitResult {
  const itemsSubtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0))

  // Per-person pre-tax subtotal from share weights.
  const subtotals: Record<string, number> = {}
  const lines: Record<string, ShareLine[]> = {}
  people.forEach((p) => { subtotals[p.id] = 0; lines[p.id] = [] })

  let assignedSubtotal = 0
  for (const item of items) {
    const weights = assignments[item.id] || {}
    const totalWeight = people.reduce((s, p) => s + (weights[p.id] || 0), 0)
    if (totalWeight <= 0) continue // unassigned
    const cost = item.price * item.qty
    assignedSubtotal += cost
    for (const p of people) {
      const w = weights[p.id] || 0
      if (w <= 0) continue
      const amount = (cost * w) / totalWeight
      subtotals[p.id] += amount
      lines[p.id].push({ itemId: item.id, name: item.name || 'Item', weight: w, totalWeight, amount })
    }
  }
  assignedSubtotal = round2(assignedSubtotal)
  const unassigned = round2(itemsSubtotal - assignedSubtotal)

  // Charges computed on the assigned subtotal so the split always sums exactly.
  const discountTotal =
    charges.discountType === 'percent'
      ? (assignedSubtotal * Math.max(0, charges.discount)) / 100
      : Math.min(Math.max(0, charges.discount), assignedSubtotal)
  const discountedSubtotal = assignedSubtotal - discountTotal
  const serviceTotal = (discountedSubtotal * Math.max(0, charges.serviceChargePercent)) / 100
  const taxBase = charges.taxOnService ? discountedSubtotal + serviceTotal : discountedSubtotal
  const gstTotal = (taxBase * Math.max(0, charges.gstPercent)) / 100
  const grandTotal = discountedSubtotal + serviceTotal + gstTotal

  // Every charge is proportional to a person's subtotal share, so each
  // person's total is exactly grandTotal * (theirSubtotal / assignedSubtotal).
  const base = assignedSubtotal || 1
  const rawTotals = people.map((p) => (grandTotal * subtotals[p.id]) / base)
  const roundedTotals = roundToTarget(rawTotals, round2(grandTotal))

  const shares: PersonShare[] = people.map((p, idx) => {
    const ratio = subtotals[p.id] / base
    return {
      person: p,
      subtotal: round2(subtotals[p.id]),
      discount: round2(discountTotal * ratio),
      service: round2(serviceTotal * ratio),
      gst: round2(gstTotal * ratio),
      total: roundedTotals[idx],
      lines: lines[p.id],
    }
  })

  return {
    itemsSubtotal,
    assignedSubtotal,
    unassigned,
    discountTotal: round2(discountTotal),
    serviceTotal: round2(serviceTotal),
    gstTotal: round2(gstTotal),
    grandTotal: round2(grandTotal),
    shares,
  }
}

export const money = (n: number) =>
  '₹' + (Math.abs(n) < 0.005 ? 0 : n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
