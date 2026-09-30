import type { Habilitation } from '@/types/domain'
import { addMonths, differenceInCalendarDays, parseISO, subMonths } from 'date-fns'

export type AlertLevel = 'OK' | 'A_PLANIFIER' | 'URGENT' | 'EXPIREE'

export const ALERT_WINDOW_MONTHS = 12

export function habilitationAlert(h: Pick<Habilitation, 'expireLe'>, today = new Date()): AlertLevel {
  const expire = parseISO(h.expireLe)
  const days = differenceInCalendarDays(expire, today)
  if (days < 0) return 'EXPIREE'
  if (expire <= addMonths(today, 3)) return 'URGENT'
  if (subMonths(expire, ALERT_WINDOW_MONTHS) <= today) return 'A_PLANIFIER'
  return 'OK'
}

export function alertDate(expireLe: string) {
  return subMonths(parseISO(expireLe), ALERT_WINDOW_MONTHS)
}
