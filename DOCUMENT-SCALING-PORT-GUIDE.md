# Document scaling port guide (1920×912 artboard)

Portable summary of how this project constrains layout to a fixed design size and scales it to any viewport. (Previously 2560×1440; now **1920×912** — near 1920×917 with clean rem math.)

---

## Big idea

Design the UI at a fixed artboard size (**1920×912 px**). Express that size in **`rem`**, with **16px = 1rem** at scale 1. On resize, compute one **`scale`** factor that fits the artboard into the browser window, then apply it at the **document level**:

- `html { font-size: 16px × scale }` → every `rem` in CSS grows/shrinks
- `body` fills the viewport with `overflow: hidden` (Endfield-style single stage)

**Do not** use `transform: scale()` on the main shell wrapper unless you have a separate fixed-pixel layer inside a slot. The shell scales via root `rem`.

---

## Design constants (keep JS and CSS in sync)

| Token | Value | At scale 1 |
|-------|-------|------------|
| `DESIGN_ROOT_PX` | 16 | 1rem = 16px |
| `DESIGN_REM_W` / `--canvas-w` | 120rem | 1920px |
| `DESIGN_REM_H` / `--canvas-h` | 57rem | 912px |
| `CANVAS_W` | 1920 px | `120 × 16` |
| `CANVAS_H` | 912 px | `57 × 16` |
| Center stage (16:9) | 85×47.8125 rem | 1360×765 |

**CSS (`:root` or design tokens file):**

```css
html {
  font-size: 16px; /* fallback before JS runs */
}

:root {
  --canvas-w: 160rem;
  --canvas-h: 90rem;
  --page-row-otf-footer-h: 48rem; /* optional footer band */
}
```

**JS:**

```js
export const DESIGN_ROOT_PX = 16
export const DESIGN_REM_W = 160
export const DESIGN_REM_H = 90
export const CANVAS_W = DESIGN_REM_W * DESIGN_ROOT_PX // 2560
export const CANVAS_H = DESIGN_REM_H * DESIGN_ROOT_PX // 1440
```

In this repo: `vendor/waypoint-sidebar/src/luna-sidebar/canvasScale.js` and `src/luna/lunaDesignTokens.css`.

---

## Three-step pipeline

### 1. Write layout in rem

Example shell:

```css
.app-canvas-row {
  width: 100%;
  height: var(--canvas-h); /* 90rem → 1440px at scale 1 */
}

.center-column {
  width: calc(var(--canvas-w) * 0.75); /* 120rem */
  height: calc(var(--canvas-h) * 0.75); /* 67.5rem */
}

.title {
  font-size: 1.625rem; /* 26px @ 16px/rem — document design-time px in comments */
}
```

Comments like `/* 26px @ 16px/rem */` mean “this is the pixel value at scale 1,” not a hard-coded runtime size.

### 2. Compute contain scale on resize

Fit the full artboard inside the viewport (letterboxing allowed):

```js
function getCanvasContainScale(width, height) {
  const sx = width / CANVAS_W
  const sy = height / CANVAS_H
  return Math.min(sx, sy)
}
```

Examples:

| Viewport | Scale |
|----------|-------|
| 2560×1440 | `min(1, 1) = 1` |
| 1920×1080 | `min(0.75, 0.75) = 0.75` |
| 1280×720 | `min(0.5, 0.5) = 0.5` |

**Footer policy:** By default, scale uses **canvas height only** (`CANVAS_H`), not canvas + footer. That way a 2560×1440 monitor shows the main row at true design size; the footer scrolls below. An alternate helper `getLunaShellContainScale` shrinks the canvas to fit footer on screen — use only if you want that tradeoff.

**Viewport source:** waypoint-v2 uses `window.innerWidth` / `innerHeight` (not `visualViewport`) to avoid font-size flicker when scrollbars appear (e.g. sidebar drawer opening). See `getLunaScaleViewportSize()` in `src/luna/applyLunaDocumentScale.ts`.

### 3. Apply scale to `html` (and size `body`)

```js
function applyDocumentScale(scale, viewport) {
  const rootPx = DESIGN_ROOT_PX * scale
  const contentH = CANVAS_H * scale + FOOTER_H * scale // FOOTER_H = 0 if none

  document.documentElement.style.fontSize = `${rootPx}px`
  document.documentElement.style.scrollbarGutter = 'stable'

  document.body.style.width = `${viewport.width}px`
  document.body.style.minWidth = `${viewport.width}px`
  document.body.style.height = `${Math.max(contentH, viewport.height)}px`
  document.body.style.minHeight = `${viewport.height}px`
  document.body.style.margin = '0'
}

function resetDocumentScale() {
  document.documentElement.style.fontSize = ''
  document.body.style.width = ''
  document.body.style.height = ''
  // …clear other inline styles set above
}
```

At scale `0.75`: `html` font-size becomes `12px`, so `90rem` canvas row = `90 × 12 = 1080px` tall.

**What each layer does:**

| Element | Role |
|---------|------|
| `html` font-size | Scales **all rem** across the app |
| `body` width/height | Fills the **viewport**; enables scroll when content (e.g. footer) exceeds viewport |
| `.app-shell` in rem | Holds the actual **2560×1440-proportional** layout |

In this repo: `src/luna/applyLunaDocumentScale.ts`.

---

## Shell component wiring (React)

Mount a root shell component that owns scale state:

```tsx
useLayoutEffect(() => {
  const update = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    if (width <= 0 || height <= 0) return
    setScale(getCanvasContainScale(width, height))
    setViewport({ width, height })
  }
  update()
  window.addEventListener('resize', update)
  return () => window.removeEventListener('resize', update)
}, [])

useLayoutEffect(() => {
  if (viewport.width <= 0) return
  applyDocumentScale(scale, viewport)
}, [scale, viewport])

useLayoutEffect(() => () => resetDocumentScale(), [])
```

In this repo: `src/luna/LunaChrome.tsx`.

Optional: pass `scale` through React context for JS that needs the numeric factor (custom scrollbars, canvas overlays). Layout itself does not need it — CSS `rem` handles proportions.

---

## DOM shape (typical)

```
html                    ← font-size: 16 × scale (set by JS)
body                    ← width/height: viewport px (set by JS)
  #root
    .luna-root          ← width: 100%; flex column
      .luna-canvas-row  ← height: var(--canvas-h) — NO transform
        navbar, gutters, center column, sidebar …
      .luna-footer-slot ← height: var(--page-row-otf-footer-h) (optional)
```

Center stage slot (75% of canvas in this project):

```css
--luna-center-slot: 0.75;
width:  calc(var(--canvas-w) * var(--luna-center-slot));
height: calc(var(--canvas-h) * var(--luna-center-slot));
```

Inner iframe/artboard content should fill its slot at `width/height: 100%`. Avoid a second `transform: scale()` on the same tree.

---

## Minimal copy-paste starter

```js
const CANVAS_W = 1920
const CANVAS_H = 912
const ROOT_PX = 16

function getScale(viewportW, viewportH) {
  return Math.min(viewportW / CANVAS_W, viewportH / CANVAS_H)
}

function applyDocumentScale(scale, viewport) {
  document.documentElement.style.fontSize = `${ROOT_PX * scale}px`
  document.body.style.width = `${viewport.width}px`
  document.body.style.height = `${viewport.height}px`
  document.body.style.overflow = 'hidden'
}

function onResize() {
  const viewport = { width: innerWidth, height: innerHeight }
  applyDocumentScale(getScale(viewport.width, viewport.height), viewport)
}

window.addEventListener('resize', onResize)
onResize()
```

---

## Files in this repo (vanilla Endfield-style)

| File | Purpose |
|------|---------|
| `src/scale.js` | Artboard constants + contain rem scaler |
| `src/main.js` | State, HTML templates, mount/patch, events |
| `src/styles/tokens.css` | `--canvas-w/h`, center stage, pads |
| `src/styles/chrome.css` | Shell layout |
| `_legacy-react-src/` | Previous React implementation (reference) |

## Quick DevTools verification

On a **1920×912** window:

1. `<html>` computed `font-size` should be **16px**.
2. `data-luna-scale="1"` on `<html>`.
3. `.luna-canvas-row` height should be **912px** (`57rem × 16px`).
4. Center stage should be **1360×765** (`85×47.8125 rem`).

---

## Port checklist

- [ ] Define `--canvas-w`, `--canvas-h` in CSS and `CANVAS_W`, `CANVAS_H` in JS (same numbers).
- [ ] Set `html { font-size: 16px }` as a static fallback.
- [ ] Implement `getCanvasContainScale(width, height)`.
- [ ] Implement `applyDocumentScale` / `resetDocumentScale`.
- [ ] Root shell: resize listener → compute scale → apply → reset on unmount.
- [ ] Write shell layout in **rem**, not px.
- [ ] Remove `transform: scale()` from shell wrappers (unless you have a deliberate nested artboard).
- [ ] Keep `position: fixed` UI (modals, scrims) **outside** transformed ancestors.
- [ ] Decide footer policy: scroll below canvas (default) vs shrink canvas to fit footer on screen.
- [ ] Test at **2560×1440**: scale = 1, `html` font-size = 16px, main row ≈ 1440px tall.

---

## Pitfalls (lessons from waypoint-v2)

| Avoid | Why |
|-------|-----|
| Double scaling (shell rem + inner `transform: scale()`) | UI shrinks twice; hard to debug |
| Including footer in scale denominator when you want true 1440px canvas | Canvas looks ~65% on a 1440p monitor |
| `transform: scale()` on the main row | Breaks `position: fixed`, complicates hit-testing |
| Mixing px layout with rem shell | px elements don’t track artboard scale |
| Forgetting to reset on unmount | Next route/page keeps wrong `html` font-size |

**Before (removed):** `--luna-scale` + `transform: scale()` on `.luna-canvas-row` and nested wrappers.

**After (current):** Single scale via `html` font-size; shell uses rem only.

---

## Files to reference in waypoint-v2

| File | Purpose |
|------|---------|
| `src/luna/applyLunaDocumentScale.ts` | Applies scale to `html` / `body`; reset on unmount |
| `src/luna/LunaChrome.tsx` | Resize watcher, scale state, shell mount |
| `src/luna/lunaDesignTokens.css` | `--canvas-w`, `--canvas-h`, footer rem |
| `src/luna/lunaChrome.css` | Rem-based shell layout (no shell transform) |
| `vendor/waypoint-sidebar/src/luna-sidebar/canvasScale.js` | `CANVAS_*`, scale helpers |
| `src/index.css` | Default `html { font-size: 16px }` |
| `public/LUNA-DOCUMENT-SCALING-HANDOFF.txt` | Earlier internal handoff (some body-width notes differ slightly from current code) |

---

## Mental model

```
Design at 2560×1440
       ↓
Express as 160×90 rem (16px/rem)
       ↓
Resize → scale = min(viewportW/2560, viewportH/1440)
       ↓
html font-size = 16 × scale
       ↓
All rem values scale automatically
```

---

## Quick DevTools verification

On a **2560×1440** window:

1. `<html>` computed `font-size` should be **16px**.
2. `data-luna-scale="1"` on `<html>` (this project sets this for debugging).
3. `.luna-canvas-row` height should be **1440px** (`90rem × 16px`).

On a **1920×1080** window:

1. `<html>` font-size should be **12px** (scale 0.75).
2. Canvas row height should be **1080px** (`90rem × 12px`).
