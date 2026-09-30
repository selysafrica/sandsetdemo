import { differenceInCalendarDays, format, formatDistanceToNowStrict, intervalToDuration, isValid, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const moneyFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('fr-FR')

export const TRANSITION_DEADLINE = '2029-09-15'
export const TRANSITION_START = '2026-09-15'

export function money(value: number) {
  return `${moneyFormatter.format(Math.round(value))} FCFA`
}

export function moneyShort(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000).toLocaleString('fr-FR')} k`
  return moneyFormatter.format(value)
}

export function num(value: number) {
  return numberFormatter.format(value)
}

export function pct(value: number) {
  return `${Math.round(value)} %`
}

function toDate(value: string | Date) {
  return typeof value === 'string' ? parseISO(value) : value
}

export function date(value?: string | Date) {
  if (!value) return '—'
  const d = toDate(value)
  return isValid(d) ? format(d, 'd MMM yyyy', { locale: fr }) : '—'
}

export function dateLong(value: string | Date) {
  return format(toDate(value), 'EEEE d MMMM yyyy', { locale: fr })
}

export function dateTime(value: string | Date) {
  return format(toDate(value), "d MMM yyyy 'à' HH:mm", { locale: fr })
}

export function monthLabel(value: string | Date) {
  return format(toDate(value), 'MMM yy', { locale: fr })
}

export function relative(value: string | Date) {
  return formatDistanceToNowStrict(toDate(value), { locale: fr, addSuffix: true })
}

export function daysUntil(value: string | Date) {
  return differenceInCalendarDays(toDate(value), new Date())
}

export function isoDate(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export function transitionRemaining(now = new Date()) {
  const end = parseISO(TRANSITION_DEADLINE)
  const d = intervalToDuration({ start: now, end })
  const total = differenceInCalendarDays(end, parseISO(TRANSITION_START))
  const elapsed = differenceInCalendarDays(now, parseISO(TRANSITION_START))
  return {
    years: d.years ?? 0,
    months: d.months ?? 0,
    days: d.days ?? 0,
    totalDays: differenceInCalendarDays(end, now),
    elapsedPct: Math.min(100, Math.max(0, (elapsed / total) * 100)),
  }
}
