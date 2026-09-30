import type { CSSProperties } from 'react'
import { readableOn, shade, tint } from './utils'

/** CSS variables that re-theme primary actions to a licensee's accent colour. */
export function accentStyle(hex: string): CSSProperties {
  return {
    '--accent': hex,
    '--accent-hover': shade(hex, 0.14),
    '--accent-soft': tint(hex, 0.9),
    '--accent-fg': readableOn(hex),
  } as CSSProperties
}
