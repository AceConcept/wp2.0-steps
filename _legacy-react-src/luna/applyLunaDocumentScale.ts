import {
  CANVAS_H,
  CANVAS_W,
  DESIGN_ROOT_PX,
  getOtfFooterDesignHeightPx,
} from 'waypoint-sidebar/src/luna-sidebar/canvasScale.js'

const LUNA_SCALE_ATTR = 'data-luna-scale'
const LUNA_SCALED_CLASS = 'luna-document-scaled'

export type LunaViewportSize = {
  width: number
  height: number
}

/**
 * Stable viewport for scale math — avoids visualViewport / scrollbar width flicker
 * when the drawer opens (overflow/scrollbar shifts used to change html font-size).
 */
export function getLunaScaleViewportSize(): LunaViewportSize {
  if (typeof window === 'undefined') {
    return { width: CANVAS_W, height: CANVAS_H }
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

/**
 * OTF-style document scaling: root rem from contain scale (min of width/height ratios).
 * Body is sized to the viewport so the page fills the window; shell rem layout still uses scale.
 */
export function applyLunaDocumentScale(
  scale: number,
  viewport: LunaViewportSize,
) {
  if (typeof document === 'undefined') return

  const rootPx = DESIGN_ROOT_PX * scale
  const contentH = CANVAS_H * scale + getOtfFooterDesignHeightPx() * scale

  const html = document.documentElement
  html.style.fontSize = `${rootPx}px`
  html.style.scrollbarGutter = 'stable'
  html.setAttribute(LUNA_SCALE_ATTR, String(scale))
  html.classList.add(LUNA_SCALED_CLASS)

  const body = document.body
  body.style.width = `${viewport.width}px`
  body.style.minWidth = `${viewport.width}px`
  body.style.height = `${Math.max(contentH, viewport.height)}px`
  body.style.minHeight = `${viewport.height}px`
  body.style.margin = '0'
  body.style.overflowX = 'auto'
  body.style.overflowY = 'auto'
}

export function resetLunaDocumentScale() {
  if (typeof document === 'undefined') return

  const html = document.documentElement
  html.style.fontSize = ''
  html.style.scrollbarGutter = ''
  html.removeAttribute(LUNA_SCALE_ATTR)
  html.classList.remove(LUNA_SCALED_CLASS)

  const body = document.body
  body.style.width = ''
  body.style.minWidth = ''
  body.style.height = ''
  body.style.minHeight = ''
  body.style.margin = ''
  body.style.overflowX = ''
  body.style.overflowY = ''
}
