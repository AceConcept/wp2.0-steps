/** Generic numbered step ids (1–2). */
export type FlowStepId = '1' | '2'

export const FLOW_STEP_IDS = ['1', '2'] as const satisfies readonly FlowStepId[]

/** Shell URL hashes (`#1` … `#2`). */
export const POLAR_SYS_HASH: Record<FlowStepId, string> = {
  '1': '#1',
  '2': '#2',
}

/** iframe origin — https://integration-node-view.vercel.app */
export const STAGE_EMBED_ORIGIN = 'https://integration-node-view.vercel.app'

/** Per-step iframe URLs (path-based, not hash-based). */
const STAGE_EMBED_URLS: Record<FlowStepId, string> = {
  '1': STAGE_EMBED_ORIGIN,
  '2': `${STAGE_EMBED_ORIGIN}/integration/python-1`,
}

export function getStageEmbedOrigin(): string {
  const envOrigin = import.meta.env.VITE_STAGE_EMBED_ORIGIN as string | undefined
  if (envOrigin?.trim()) return envOrigin.trim().replace(/\/$/, '')
  return STAGE_EMBED_ORIGIN
}

export function stageEmbedUrlForStep(id: FlowStepId): string {
  const envOrigin = import.meta.env.VITE_STAGE_EMBED_ORIGIN as string | undefined
  if (envOrigin?.trim()) {
    const base = envOrigin.trim().replace(/\/$/, '')
    if (id === '1') return base
    return `${base}/integration/python-1`
  }
  return STAGE_EMBED_URLS[id]
}
