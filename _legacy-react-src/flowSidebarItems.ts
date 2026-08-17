import { FLOW_STEPS, type FlowStepId } from './store/flowStore'
import { STEP_DESCRIPTIONS, STEP_TITLES } from './stepDescriptions'

/**
 * Luna drawer + preview rail — titles, descriptions, optional **thumbUrl** / **heroImageUrl** (`public/` paths).
 */
export type FlowSidebarItem = {
  id: FlowStepId
  label: string
  step: string
  title: string
  description: string
  /** Preview list line under step label; defaults to `description` when omitted. */
  previewDescription?: string
  swatch: string
  thumbUrl?: string
  heroImageUrl?: string
}

const STEP_IMAGE_FILES: Record<1 | 2, string> = {
  1: 'Node-StepOne.png',
  2: 'Node-steptwo.png',
}

function stepImagePath(n: 1 | 2): string {
  const base = `/step_imgs/${encodeURIComponent(STEP_IMAGE_FILES[n])}`
  const v = typeof __STEP_IMG_VER__ !== 'undefined' && __STEP_IMG_VER__
    ? __STEP_IMG_VER__
    : ''
  return v ? `${base}?v=${encodeURIComponent(v)}` : base
}

const SWATCHES = [
  '#e8e4f0',
  '#cab6e0',
  '#dcd4ec',
  '#e4dce8',
  '#d8cfe8',
  '#cfc8e0',
] as const

export const FLOW_SIDEBAR_ITEMS: FlowSidebarItem[] = FLOW_STEPS.map((step, i) => {
  const stepNum = (i + 1) as 1 | 2
  const imageUrl = stepImagePath(stepNum)
  return {
    id: step.id,
    label: STEP_TITLES[i] ?? STEP_TITLES[0],
    step: STEP_TITLES[i] ?? STEP_TITLES[0],
    title: STEP_TITLES[i] ?? STEP_TITLES[0],
    description: STEP_DESCRIPTIONS[i] ?? STEP_DESCRIPTIONS[0],
    previewDescription: '-',
    swatch: SWATCHES[i] ?? SWATCHES[0],
    thumbUrl: imageUrl,
    heroImageUrl: imageUrl,
  }
})
