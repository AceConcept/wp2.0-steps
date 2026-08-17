/**
 * Document rem scaler — Endfield / Luna contain style.
 * Design artboard: 1920×917 (120 × 57.3125 rem @ 16px).
 */

export const DESIGN_ROOT_PX = 16
export const DESIGN_REM_W = 120
export const DESIGN_REM_H = 57.3125
export const CANVAS_W = DESIGN_REM_W * DESIGN_ROOT_PX // 1920
export const CANVAS_H = DESIGN_REM_H * DESIGN_ROOT_PX // 917

const SCALE_ATTR = 'data-luna-scale'
const SCALED_CLASS = 'luna-document-scaled'

export function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

/** Fit full artboard inside viewport (letterbox allowed). Same as Endfield root rem math. */
export function getContainScale(width, height) {
  return Math.min(width / CANVAS_W, height / CANVAS_H)
}

export function applyDocumentScale(scale, viewport = getViewportSize()) {
  const rootPx = DESIGN_ROOT_PX * scale
  const html = document.documentElement
  html.style.fontSize = `${rootPx}px`
  html.style.scrollbarGutter = 'stable'
  html.setAttribute(SCALE_ATTR, String(scale))
  html.classList.add(SCALED_CLASS)

  const body = document.body
  body.style.width = `${viewport.width}px`
  body.style.minWidth = `${viewport.width}px`
  body.style.height = `${viewport.height}px`
  body.style.minHeight = `${viewport.height}px`
  body.style.margin = '0'
  body.style.overflow = 'hidden'
}

export function resetDocumentScale() {
  const html = document.documentElement
  html.style.fontSize = ''
  html.style.scrollbarGutter = ''
  html.removeAttribute(SCALE_ATTR)
  html.classList.remove(SCALED_CLASS)

  const body = document.body
  body.style.width = ''
  body.style.minWidth = ''
  body.style.height = ''
  body.style.minHeight = ''
  body.style.margin = ''
  body.style.overflow = ''
}

export function bindDocumentScale() {
  const update = () => {
    const viewport = getViewportSize()
    if (viewport.width <= 0 || viewport.height <= 0) return
    applyDocumentScale(getContainScale(viewport.width, viewport.height), viewport)
  }

  update()
  let frame = 0
  const onResize = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(update)
  }
  window.addEventListener('resize', onResize)
  return () => {
    window.removeEventListener('resize', onResize)
    cancelAnimationFrame(frame)
    resetDocumentScale()
  }
}
