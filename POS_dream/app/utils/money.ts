import Decimal from 'decimal.js'

// Use Decimal for every money calculation; JavaScript numbers lose cents (0.1 + 0.2).
export function toMoney(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

const bahtFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2
})

export function formatBaht(value: Decimal.Value): string {
  return bahtFormatter.format(toMoney(value).toNumber())
}
