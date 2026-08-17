/** Vendored `vendor/waypoint-sidebar` — local package, not fetched from upstream. */
declare module 'waypoint-sidebar/src/luna-sidebar/index.js' {
  import type { ComponentType, Context } from 'react'

  export const LunaCanvasScaleContext: Context<number>

  export type LunaSidebarProps = {
    items: unknown[]
    expanded?: boolean
    onExpandedChange?: (next: boolean) => void
    initialActiveId?: string
    onActiveItemChange?: (id: string) => void
    onInfo?: () => void
    infoHref?: string
    infoOpenInNewTab?: boolean
    infoTooltip?: string
    railLabel?: string
    graphicSrc?: string
    defaultExpanded?: boolean
  }

  export const LunaSidebar: ComponentType<LunaSidebarProps>
}

declare module 'waypoint-sidebar/src/luna-sidebar/canvasScale.js' {
  export const CANVAS_H: number
  export const CANVAS_W: number
  export const DESIGN_ROOT_PX: number
  export const SIDEBAR_COLLAPSED_REM: number
  export const SIDEBAR_EXPANDED_REM: number
  export function getCanvasContainScale(width: number, height: number): number
  export function getCanvasFillViewportScale(width: number, height: number): number
  export function getLunaShellContainScale(width: number, height: number): number
  export function getOtfFooterDesignHeightPx(): number
  export function getSidebarShellDesignWidthPx(expanded: boolean): number
  export function getViewportSize(): { width: number; height: number }
}
