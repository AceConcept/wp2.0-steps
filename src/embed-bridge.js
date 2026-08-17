import { getStageEmbedOrigin } from './data/steps.js'

export const STAGE_EMBED_SET_STEP = 'atencium-set-step'
export const STAGE_EMBED_STEP_CHANGED = 'atencium-step-changed'
export const STAGE_EMBED_REQUEST_STEP = 'atencium-request-step'

let stageIframe = null

export function registerStageEmbedFrame(frame) {
  stageIframe = frame
}

function embedTargetOrigin() {
  if (!stageIframe?.src) return getStageEmbedOrigin()
  try {
    return new URL(stageIframe.src, window.location.href).origin
  } catch {
    return getStageEmbedOrigin()
  }
}

export function postStageEmbedStep(step) {
  const win = stageIframe?.contentWindow
  if (!win) return
  win.postMessage({ type: STAGE_EMBED_SET_STEP, step }, embedTargetOrigin())
}

export function requestStageEmbedStep() {
  const win = stageIframe?.contentWindow
  if (!win) return
  win.postMessage({ type: STAGE_EMBED_REQUEST_STEP }, embedTargetOrigin())
}
