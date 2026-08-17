import { getStageEmbedOrigin } from './stageEmbedConfig'

export const STAGE_EMBED_SET_STEP = 'atencium-set-step' as const
/** iframe → shell when user changes step inside the embed */
export const STAGE_EMBED_STEP_CHANGED = 'atencium-step-changed' as const
/** shell asks iframe for current step (polling fallback) */
export const STAGE_EMBED_REQUEST_STEP = 'atencium-request-step' as const

let stageIframe: HTMLIFrameElement | null = null

export function registerStageEmbedFrame(frame: HTMLIFrameElement | null) {
  stageIframe = frame
}

function embedTargetOrigin(): string {
  if (!stageIframe?.src) return getStageEmbedOrigin()
  try {
    return new URL(stageIframe.src, window.location.href).origin
  } catch {
    return getStageEmbedOrigin()
  }
}

export function postStageEmbedStep(step: number) {
  const win = stageIframe?.contentWindow
  if (!win) return
  win.postMessage({ type: STAGE_EMBED_SET_STEP, step }, embedTargetOrigin())
}

/** Ask the iframe to report its current step (requires updated steps-project-slot). */
export function requestStageEmbedStep() {
  const win = stageIframe?.contentWindow
  if (!win) return
  win.postMessage({ type: STAGE_EMBED_REQUEST_STEP }, embedTargetOrigin())
}
