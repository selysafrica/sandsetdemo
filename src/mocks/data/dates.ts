import { addDays, addMonths, formatISO } from 'date-fns'

const ANCHOR = new Date()
ANCHOR.setHours(9, 0, 0, 0)

export function daysFromNow(n: number) {
  return formatISO(addDays(ANCHOR, n), { representation: 'date' })
}

export function monthsFromNow(n: number, extraDays = 0) {
  return formatISO(addDays(addMonths(ANCHOR, n), extraDays), { representation: 'date' })
}

export function timestamp(daysAgo: number, hour = 10, minute = 0) {
  const d = addDays(ANCHOR, -daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
