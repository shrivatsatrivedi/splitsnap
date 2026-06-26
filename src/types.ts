export interface BillItem {
  id: string
  name: string
  qty: number
  price: number // unit price; line cost = price * qty
}

export interface Person {
  id: string
  name: string
  color: string
}

// assignments[itemId][personId] = that person's SHARE WEIGHT of the item.
// An item's full cost is divided among its sharers in proportion to weights.
//   - 1 weight each  -> equal split
//   - weights 2 & 1  -> 2/3 and 1/3
//   - no entries     -> item is unassigned
// This model makes every mathematically-possible split expressible and can
// never go negative.
export type Assignments = Record<string, Record<string, number>>

export type DiscountType = 'flat' | 'percent'

export interface Charges {
  gstPercent: number
  serviceChargePercent: number
  discount: number
  discountType: DiscountType
  // Whether GST is charged on (subtotal + service charge) — the common case
  // on Indian restaurant bills — or on the subtotal alone.
  taxOnService: boolean
}
