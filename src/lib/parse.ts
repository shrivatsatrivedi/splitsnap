import { uid } from './id'
import type { BillItem } from '../types'

// Lines that are clearly not line-items (headers, totals, tax rows, footers).
const SKIP_RE = new RegExp(
  [
    'sub\\s*total', 'subtotal', 'grand\\s*total', '\\btotal\\b', 'amount\\s*due',
    'balance', 'change', 'cash', 'card', 'upi', 'paid', 'tender', 'tip',
    'gst', 'cgst', 'sgst', 'igst', 'vat', '\\btax\\b', 'service\\s*charge',
    'discount', 'round\\s*off', 'rounding', 'savings',
    'invoice', 'bill\\s*no', 'receipt', 'order\\s*no', 'token', 'table',
    'date', 'time', 'cashier', 'server', '\\bqty\\b', '\\brate\\b', '\\bamount\\b',
    'thank', 'visit', 'welcome', 'gstin', '\\btin\\b', 'fssai', 'phone',
    'tel', 'mobile', 'www', 'http', '@', 'terms', 'no\\.',
  ].join('|'),
  'i',
)

// A price token: 1,234.56 | 1234.56 | 1.234,56 | 234 (with optional currency).
const MONEY_RE = /(?:₹|rs\.?|inr|\$|€|£)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/gi

function parseMoney(token: string): number {
  let s = token.replace(/[₹$€£]|rs\.?|inr/gi, '').trim()
  // Decide decimal separator: if it ends with ",dd" treat comma as decimal.
  if (/,\d{1,2}$/.test(s) && !/\.\d/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    s = s.replace(/,/g, '')
  }
  const n = parseFloat(s)
  return isFinite(n) ? n : NaN
}

export interface ParseResult {
  items: BillItem[]
  confidence: 'good' | 'partial' | 'none'
}

export function parseItems(text: string): ParseResult {
  const items: BillItem[] = []
  const lines = text.split(/\r?\n/)
  let priceLinesSeen = 0

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim()
    if (line.length < 3) continue

    // Collect money tokens with their positions.
    const tokens: { value: number; index: number }[] = []
    let m: RegExpExecArray | null
    MONEY_RE.lastIndex = 0
    while ((m = MONEY_RE.exec(line)) !== null) {
      const value = parseMoney(m[0])
      if (isFinite(value)) tokens.push({ value, index: m.index })
    }
    if (tokens.length > 0) priceLinesSeen++

    if (SKIP_RE.test(line)) continue
    if (tokens.length === 0) continue

    // The amount is the last money token on the line.
    const amountTok = tokens[tokens.length - 1]
    const amount = amountTok.value
    if (!(amount > 0) || amount > 1_000_000) continue

    // Leading quantity: "2 ", "2x", "2 x", "2 *", "x2".
    let qty = 1
    let nameStart = 0
    const qtyLead = line.match(/^(\d{1,3})\s*[xX*]?\s+(?=\D)/)
    const qtyX = line.match(/^[xX]\s*(\d{1,3})\s+/)
    if (qtyLead) {
      qty = parseInt(qtyLead[1], 10) || 1
      nameStart = qtyLead[0].length
    } else if (qtyX) {
      qty = parseInt(qtyX[1], 10) || 1
      nameStart = qtyX[0].length
    }

    // Name = text before the amount token, minus the leading qty and any
    // stray inner numbers (e.g. a unit-price column).
    let name = line.slice(nameStart, amountTok.index)
    name = name
      .replace(/(?:₹|rs\.?|inr|\$|€|£)/gi, '')
      .replace(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?\b/g, ' ') // drop inner numbers
      .replace(/[.\-_•·:|]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()

    const letters = name.replace(/[^a-zA-Z]/g, '').length
    if (letters < 2) continue // need a real name
    if (name.length > 48) name = name.slice(0, 48).trim()

    if (qty < 1) qty = 1
    const unit = qty > 1 ? amount / qty : amount
    items.push({ id: uid(), name, qty, price: Math.round(unit * 100) / 100 })
  }

  const confidence: ParseResult['confidence'] =
    items.length >= 3 ? 'good' : items.length >= 1 ? 'partial' : priceLinesSeen > 0 ? 'partial' : 'none'

  return { items, confidence }
}
