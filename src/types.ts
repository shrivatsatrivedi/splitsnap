export interface BillItem {
  id: string
  name: string
  qty: number
  price: number // unit price
}

export interface Person {
  id: string
  name: string
  color: string
}

// assignments[itemId][personId] = quantity that person consumed
export type Assignments = Record<string, Record<string, number>>

export interface Charges {
  gstPercent: number
  serviceChargePercent: number
  discount: number // flat currency amount
}
