import { create } from 'zustand'
import { STEP_DESCRIPTIONS, STEP_TITLES } from '../stepDescriptions'
import { postStageEmbedStep } from './stageEmbedBridge'
import {
  FLOW_STEP_IDS,
  POLAR_SYS_HASH,
  type FlowStepId,
} from './stageEmbedConfig'

export type { FlowStepId } from './stageEmbedConfig'
export {
  FLOW_STEP_IDS,
  getStageEmbedOrigin,
  POLAR_SYS_HASH,
  STAGE_EMBED_ORIGIN,
  stageEmbedUrlForStep,
} from './stageEmbedConfig'

/** Map `#1` … `#2` (or legacy `#/N`) to step ids. */
export function polarFlowIdFromHash(hash: string): FlowStepId {
  const segment = String(hash || '')
    .replace(/^#/, '')
    .replace(/^\//, '')
    .trim()
  if (FLOW_STEP_IDS.includes(segment as FlowStepId)) {
    return segment as FlowStepId
  }
  return '1'
}

export const FLOW_STEPS: {
  id: FlowStepId
  title: string
  body: string
}[] = FLOW_STEP_IDS.map((id, i) => ({
  id,
  title: STEP_TITLES[i] ?? STEP_TITLES[0],
  body: STEP_DESCRIPTIONS[i] ?? STEP_DESCRIPTIONS[0],
}))

function initialStepIndexFromLocation(): number {
  if (typeof window === 'undefined') return 0
  const id = polarFlowIdFromHash(window.location.hash)
  const index = FLOW_STEPS.findIndex((s) => s.id === id)
  return index >= 0 ? index : 0
}

type FlowState = {
  stepIndex: number
  next: () => void
  back: () => void
  goToStep: (index: number) => void
  goToStepById: (id: FlowStepId) => void
  /** Shell trackers only — iframe already navigated (avoids round-trip). */
  syncStepFromEmbed: (id: FlowStepId) => void
  reset: () => void
}

export const useFlowStore = create<FlowState>((set, get) => ({
  stepIndex: initialStepIndexFromLocation(),
  next: () => {
    const i = get().stepIndex
    if (i < FLOW_STEPS.length - 1) get().goToStepById(FLOW_STEPS[i + 1].id)
  },
  back: () => {
    const i = get().stepIndex
    if (i > 0) get().goToStepById(FLOW_STEPS[i - 1].id)
  },
  goToStep: (index) => {
    if (index >= 0 && index < FLOW_STEPS.length) get().goToStepById(FLOW_STEPS[index].id)
  },
  goToStepById: (id) => {
    const index = FLOW_STEPS.findIndex((s) => s.id === id)
    if (index < 0) return
    if (get().stepIndex === index) return
    set({ stepIndex: index })
    if (typeof window !== 'undefined') {
      const hash = POLAR_SYS_HASH[id]
      if (window.location.hash !== hash) {
        const url = new URL(window.location.href)
        url.hash = hash
        window.history.replaceState(null, '', url)
      }
      postStageEmbedStep(Number(id)) // no-op until slot deploy listens; src hash is primary
    }
  },
  syncStepFromEmbed: (id) => {
    const index = FLOW_STEPS.findIndex((s) => s.id === id)
    if (index < 0) return
    if (get().stepIndex === index) return
    set({ stepIndex: index })
    if (typeof window !== 'undefined') {
      const hash = POLAR_SYS_HASH[id]
      if (window.location.hash !== hash) {
        const url = new URL(window.location.href)
        url.hash = hash
        window.history.replaceState(null, '', url)
      }
    }
  },
  reset: () => set({ stepIndex: 0 }),
}))

export function useFlowStep() {
  const stepIndex = useFlowStore((s) => s.stepIndex)
  const step = FLOW_STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === FLOW_STEPS.length - 1
  return { stepIndex, step, isFirst, isLast }
}
