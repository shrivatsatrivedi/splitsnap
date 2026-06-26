import { uid } from './id'
import type { BillItem } from '../types'

// Heuristic parser: turn raw OCR text into bill items.
// Looks for lines that end in a price, optionally led by a quantity.
const PRICE_RE = /(\d{1,3}(?:[.,]\d{3})*|\d+)(?:[.,]\d{2})/g
const SKIP_RE = /(sub\s*total|subtotal|total|gst|cgst|sgst|igst|vat|tax|service|charge|discount|round|cash|change|balance|invoice|bill\s*no|table|date|time|thank|gstin|tin|phone|tel)/i

function toNum(s: string): number {
  // normalise "1,234.56" / "1.234,56" -> number
  const cleaned = s.replace(/\s/g, '')
  if (/,\d{2}$/.test(cleaned) && !/\.\d/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  }
  return parseFloat(cleaned.replace(/,/g, ''))
}

export function parseItems(text: string): BillItem[] {
  const items: BillItem[] = []
  const lines = text.split(/\r?\n/)

  for (const raw of lines) {
    const line = raw.trim()
    if (line.length < 3) continue
    if (SKIP_RE.test(line)) continue

    const prices = line.match(PRICE_RE)
    if (!prices || prices.length === 0) continue

    const price = toNum(prices[prices.length - 1])
    if (!isFinite(price) || price <= 0) continue

    // leading quantity? e.g. "2 Paneer Tikka 360"
    let qty = 1
    const qtyMatch = line.match(/^(\d{1,2})\s*[xX*]?\s+/)
    let nameStart = 0
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10) || 1
      nameStart = qtyMatch[0].length
    }

    let name = line
      .slice(nameStart)
      .replace(PRICE_RE, '')
      .replace(/[₹$€£]/g, '')
      .replace(/[-_.•·:]+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (name.replace(/[^a-zA-Z]/g, '').length < 2) continue // need real letters
    if (name.length > 40) name = name.slice(0, 40)

    items.push({ id: uid(), name, qty, price: qty > 1 ? price / qty : price })
  }
  return items
}
