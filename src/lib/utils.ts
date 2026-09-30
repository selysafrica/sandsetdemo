import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function initials(first: string, last?: string) {
  return `${first.charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase()
}

export function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}

export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K) {
  return items.reduce(
    (acc, item) => {
      const k = key(item)
      ;(acc[k] ??= []).push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function downloadText(fileName: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export function toCsv(rows: Record<string, string | number>[], separator = ';') {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: string | number) => {
    const s = String(v)
    return s.includes(separator) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + [headers.join(separator), ...rows.map((r) => headers.map((h) => escape(r[h])).join(separator))].join('\n')
}

/** Picks white or ink text for a background colour given as #rrggbb. */
export function readableOn(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const lum = relativeLuminance(r, g, b)
  const contrastWhite = 1.05 / (lum + 0.05)
  return contrastWhite >= 4.5 ? '#ffffff' : '#0f172a'
}

export function contrastRatio(hexA: string, hexB: string) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const la = relativeLuminance(a.r, a.g, a.b)
  const lb = relativeLuminance(b.r, b.g, b.b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function relativeLuminance(r: number, g: number, b: number) {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** Darkens a hex colour by mixing it with black. */
export function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  const m = (c: number) => Math.round(c * (1 - amount))
  return `#${[m(r), m(g), m(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** Lightens a hex colour by mixing it with white. */
export function tint(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  const m = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${[m(r), m(g), m(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}
