import { animate, stagger } from 'motion'
import { bindDocumentScale } from './scale.js'
import { WAYPOINT_PROJECTS } from './data/projects.js'
import {
  DEFAULT_PROJECT_ID,
  embedExtrasForStep,
  flowSidebarItemsFor,
  flowStepsFor,
  getStageEmbedOrigin,
  getWaypointMode,
  polarFlowIdFromHash,
  STAGE_PLACEHOLDER_IMAGE,
  STAGE_PREVIEW_IMAGES,
  stageEmbedUrlForStep,
  stepMarkIconForStep,
} from './data/steps.js'
import {
  postStageEmbedStep,
  registerStageEmbedFrame,
  requestStageEmbedStep,
  setEmbedProjectId,
  STAGE_EMBED_STEP_CHANGED,
} from './embed-bridge.js'
import './styles/main.css'

const STAGE_STEP_CROSSFADE_MS = 320
const PANEL_LEAVE_MS = 0.2
const PANEL_ENTER_MS = 0.38
const PANEL_STAGGER_S = 0.05
const PANEL_SHIFT_REM = 0.7
const PANEL_EASE_LEAVE = [0.4, 0, 1, 1]
const PANEL_EASE_ENTER = [0.22, 1, 0.36, 1]
const LOADSCREEN_BG_URL = '/loadingscrn/ldingBG.png'
const PROGRESS_MS = 3000
const PAUSE_MS = 120
const SWEEP_MS_MIN = 400
const SWEEP_MS_MAX = 650
const SWEEP_MS_PER_PX = 0.35
const HOLD_MS = 250
const FADE_MS = 400

const root = document.getElementById('root')

const state = {
  mounted: false,
  loaded: false,
  loadProgress: 0,
  stepId: polarFlowIdFromHash(window.location.hash, DEFAULT_PROJECT_ID),
  headerMode: 'information', // 'information' | 'waypoint-select'
  panelTransitioning: false,
  pendingHeaderMode: null,
  chromeDirty: false,
  projectId: DEFAULT_PROJECT_ID,
  managerOpen: false,
  fullscreenOpen: false,
  stageEmbedVisible: true,
  stageSource: 'image', // 'image' | 'iframe'
  stageImageIndex: 0,
  embedSlot: 0,
  embedUrls: ['', ''],
  pendingEmbedSlot: null,
  pendingEmbedSrc: null,
}

function flowSteps() {
  return flowStepsFor(state.projectId)
}

function sidebarItems() {
  return flowSidebarItemsFor(state.projectId)
}

function currentStep() {
  const steps = flowSteps()
  return steps.find((s) => s.id === state.stepId) ?? steps[0]
}

function currentStepIndex() {
  return Math.max(0, flowSteps().findIndex((s) => s.id === state.stepId))
}

function currentStageImage() {
  return STAGE_PREVIEW_IMAGES[state.stageImageIndex] ?? STAGE_PLACEHOLDER_IMAGE
}

function useStageIframe() {
  return state.stageSource === 'iframe'
}

function cycleStageImage() {
  if (useStageIframe()) {
    setStageSource('image')
    return
  }
  const total = STAGE_PREVIEW_IMAGES.length
  if (total < 2) return
  state.stageImageIndex = (state.stageImageIndex + 1) % total
  const src = currentStageImage()
  root.querySelectorAll('.stepscreen-stage-image').forEach((img) => {
    img.setAttribute('src', src)
  })
}

function setStageSource(source) {
  if (source !== 'image' && source !== 'iframe') return
  if (state.stageSource === source) return
  state.stageSource = source
  if (source === 'iframe') {
    state.embedSlot = 0
    state.embedUrls = ['', '']
    state.pendingEmbedSlot = null
    state.pendingEmbedSrc = null
    ensureEmbedUrls()
  } else {
    registerStageEmbedFrame(null)
  }
  patchStage()
  patchFullscreen()
}

function toggleStageIframe() {
  setStageSource(useStageIframe() ? 'image' : 'iframe')
}

function crumbSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function ensureEmbedUrls() {
  setEmbedProjectId(state.projectId)
  const src = stageEmbedUrlForStep(state.projectId, state.stepId)
  if (!state.embedUrls[0]) {
    state.embedUrls = [src, src]
    return
  }
  const active = state.embedSlot
  if (state.embedUrls[active] === src) return
  const next = active === 0 ? 1 : 0
  state.embedUrls[next] = src
  state.pendingEmbedSlot = next
  state.pendingEmbedSrc = src
  const frame = root.querySelector(`iframe[data-embed-frame="${next}"]`)
  if (frame && frame.getAttribute('src') !== src) {
    frame.setAttribute('src', src)
  }
}

function goToStep(id, { syncHash = true } = {}) {
  if (!flowSteps().some((s) => s.id === id)) return
  if (state.stepId === id) {
    state.managerOpen = false
    patchChrome()
    return
  }
  const prevStepId = state.stepId
  state.stepId = id
  state.managerOpen = false
  if (syncHash) {
    const hash = `#${id}`
    if (window.location.hash !== hash) {
      const url = new URL(window.location.href)
      url.hash = hash
      history.pushState(null, '', url)
    }
  }
  ensureEmbedUrls()
  const animatedInfoSelect =
    state.headerMode === 'information' &&
    !state.panelTransitioning &&
    Boolean(root.querySelector('.steps-info:not(.steps-info--select)'))
  if (animatedInfoSelect) {
    patchInfoStepSelection(prevStepId)
  } else {
    patchChrome()
  }
  patchFullscreen()
  if (useStageIframe()) {
    postStageEmbedStep(currentStepIndex() + 1, embedExtrasForStep(state.projectId, state.stepId))
  }
}

function onEmbedReady(slot) {
  if (state.pendingEmbedSlot !== slot) {
    if (slot === state.embedSlot) {
      postStageEmbedStep(currentStepIndex() + 1, embedExtrasForStep(state.projectId, state.stepId))
    }
    return
  }
  if (state.embedUrls[slot] !== state.pendingEmbedSrc) return
  state.embedSlot = slot
  state.pendingEmbedSlot = null
  state.pendingEmbedSrc = null
  syncEmbedLayers()
  postStageEmbedStep(currentStepIndex() + 1, embedExtrasForStep(state.projectId, state.stepId))
}

function syncEmbedLayers() {
  root.querySelectorAll('[data-embed-slot]').forEach((el) => {
    const slot = Number(el.getAttribute('data-embed-slot'))
    el.classList.toggle('is-active', slot === state.embedSlot)
  })
  const activeFrame = root.querySelector(
    `[data-embed-slot="${state.embedSlot}"] iframe`,
  )
  registerStageEmbedFrame(activeFrame instanceof HTMLIFrameElement ? activeFrame : null)
}

function managerMenuHtml() {
  return `
    <div class="navbar-manager-menu wp-sidebar__preview">
      <div class="wp-sidebar__preview-steps">
        ${sidebarItems().map(
          (card, index) => `
          <button type="button" class="wp-sidebar__card${card.id === state.stepId ? ' is-active' : ''}" data-action="select-step" data-step="${card.id}" role="menuitem" aria-pressed="${card.id === state.stepId}">
            <span class="wp-sidebar__card-media" style="background-color:${card.swatch}">
              ${
                card.thumbUrl
                  ? `<span class="wp-sidebar__thumb wp-sidebar__thumb--image" aria-hidden="true"><img class="wp-sidebar__thumb-image" src="${card.thumbUrl}" alt="" draggable="false" /></span>`
                  : `<span class="wp-sidebar__thumb" aria-hidden="true"><span class="wp-sidebar__thumb-index">${index + 1}</span></span>`
              }
            </span>
            <span class="wp-sidebar__card-body">
              <span class="wp-sidebar__card-step">${card.step}</span>
              <span class="wp-sidebar__card-desc">${card.previewDescription ?? card.description}</span>
            </span>
          </button>
        `,
        ).join('')}
      </div>
    </div>
  `
}

function headerSwitchHtml() {
  const infoActive = state.headerMode === 'information'
  const selectActive = state.headerMode === 'waypoint-select'
  return `
    <div class="header-switch-wrap" data-region="header-switch">
      <div class="header-switch" role="tablist" aria-label="Header mode">
        <button
          type="button"
          class="header-switch__btn${infoActive ? ' is-active' : ''}"
          data-action="set-header-mode"
          data-mode="information"
          role="tab"
          aria-selected="${infoActive}"
        >Information</button>
        <button
          type="button"
          class="header-switch__btn${selectActive ? ' is-active' : ''}"
          data-action="set-header-mode"
          data-mode="waypoint-select"
          role="tab"
          aria-selected="${selectActive}"
        >Waypoint Select</button>
      </div>
      <div class="header-switch-line" aria-hidden="true"></div>
    </div>
  `
}

function stepsInfoDockHtml() {
  return `
    <div class="steps-info-dock" data-region="steps-info-dock">
      ${headerSwitchHtml()}
      ${stepsInfoPanel()}
    </div>
  `
}

function projectSelectPanel() {
  return `
    <section class="steps-info steps-info--select" data-region="steps-info" aria-label="Waypoint project select">
      <div class="side-info-content">
        <div class="project-select" data-region="project-select">
          <header class="project-select__header" data-panel-animate>
            <div class="steps-info__block-head">
              <div class="steps-info__block-title">
                <img class="steps-info__bullet" src="/Icons/steps-info/title-icon.svg" alt="" draggable="false" aria-hidden="true" />
                <h2 class="steps-info__block-label">Waypoint Project Select</h2>
              </div>
              <div class="steps-info__block-rule-row" aria-hidden="true">
                <span class="steps-info__block-rule"></span>
                <img class="steps-info__block-icon" src="/Icons/steps-info/line-icn.svg" alt="" width="9" height="9" draggable="false" />
              </div>
            </div>
            <p class="project-select__lede">Swap projects from this screen.</p>
          </header>
          <div class="project-select__list" role="list">
            ${WAYPOINT_PROJECTS.map((project) => {
              const isActive = project.id === state.projectId
              const assets = projectCardAssets(isActive)
              return `
              <button
                type="button"
                class="project-select__card${isActive ? ' is-active' : ''}"
                data-action="select-project"
                data-project="${project.id}"
                data-panel-animate
                role="listitem"
                aria-current="${isActive ? 'true' : 'false'}"
              >
                <div class="project-select__card-chrome">
                  <img class="project-select__corner-circle" src="${assets.circle}" alt="" draggable="false" aria-hidden="true" />
                  <img class="project-select__accent" src="${assets.accent}" alt="" draggable="false" aria-hidden="true" />
                </div>
                <span class="project-select__kind">${project.kind}</span>
                <span class="project-select__name">${project.title}</span>
                <img class="project-select__title-accent" src="${assets.accent}" alt="" draggable="false" aria-hidden="true" />
                <span class="project-select__sub">${project.subtitle}</span>
                <span class="project-select__card-rule" aria-hidden="true"></span>
                <span class="project-select__body">${project.description}</span>
                <span class="project-select__glyph" aria-hidden="true"></span>
              </button>
            `
            }).join('')}
          </div>
        </div>
      </div>
      <button type="button" class="steps-info__cta" data-action="view-case-study" data-panel-animate>
        <span>Visit Main Site</span>
      </button>
    </section>
  `
}

function stepsInfoPanel() {
  if (state.headerMode === 'waypoint-select') return projectSelectPanel()

  return `
    <section class="steps-info" data-region="steps-info" aria-label="Steps info">
      <div class="side-info-content">
      <div class="steps-info__scroll">
        ${stepsInfoHeaderHtml()}
        ${stepsInfoCopyHtml()}
        </div>
        <div class="steps-stack" data-panel-animate>
          <div class="steps-container">
            <div class="steps-info__block-head">
              <div class="steps-info__block-title">
                <img class="steps-info__bullet" src="/Icons/steps-info/title-icon.svg" alt="" draggable="false" aria-hidden="true" />
                <h3 class="steps-info__block-label">Steps</h3>
              </div>
              <div class="steps-info__block-rule-row" aria-hidden="true">
                <span class="steps-info__block-rule"></span>
                <img class="steps-info__block-icon" src="/Icons/steps-info/line-icn.svg" alt="" width="9" height="9" draggable="false" />
              </div>
            </div>
            <div class="steps-info__list" role="list">
              ${flowSteps().map(
                (s, i) => `
                <button
                  type="button"
                  class="steps-info__step${s.id === state.stepId ? ' is-active' : ''}"
                  data-action="select-step"
                  data-step="${s.id}"
                  role="listitem"
                  aria-current="${s.id === state.stepId ? 'step' : 'false'}"
                >
                  <span class="steps-info__step-label">${s.title}</span>
                  <span class="steps-info__step-num">${i + 1}</span>
                </button>
              `,
              ).join('')}
            </div>
          </div>
        </div>
      </div>
      <button type="button" class="steps-info__cta" data-action="view-case-study" data-panel-animate>
        <span>View Case Study</span>
      </button>
    </section>
  `
}

function navbarHtml() {
  const step = currentStep()
  return `
    <div class="luna-absolute-pad" data-region="navbar">
      <div class="waypoint-navbar header-inner">
        <div class="header-side-left" aria-hidden="true"></div>
        <div class="header-center">
          <img
            class="header-logo"
            src="/header/waypoint-logo.svg"
            alt=""
            draggable="false"
            aria-hidden="true"
          />
          <button type="button" class="header-title" data-action="reload-page">Waypoint Manager</button>
          <nav class="header-status" aria-label="Breadcrumb">
            <ol class="header-status-crumbs">
              <li class="header-status-crumb"><a href="https://www.atencium-ui.com">atencium-ui</a></li>
              <li class="header-status-crumb">
                <button type="button" data-action="select-step" data-step="1">${getWaypointMode(state.projectId).crumb}</button>
              </li>
              <li class="header-status-crumb is-current" aria-current="page"><span>${crumbSlug(step.title)}</span></li>
            </ol>
          </nav>
        </div>
        <div class="header-side-right" aria-hidden="true"></div>
      </div>
    </div>
  `
}

function stageToolsHtml() {
  const iframeOn = useStageIframe()
  return `
    <div class="stage-tools" data-region="stage-tools" aria-label="Stage tools">
      <button type="button" class="stage-tools__btn" data-action="open-fullscreen" aria-label="Expand">
        <img src="/Icons/stage/expand-icon.svg" alt="" draggable="false" aria-hidden="true" />
      </button>
      <button type="button" class="stage-tools__btn" data-action="view-info" aria-label="Information">
        <img src="/Icons/stage/info-icon.svg" alt="" draggable="false" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="stage-tools__btn${iframeOn ? ' is-active' : ''}"
        data-action="toggle-stage-iframe"
        aria-label="${iframeOn ? 'Show stage image' : 'Show live iframe'}"
        aria-pressed="${iframeOn}"
      >
        <img src="/Icons/stage/iframe-icon.svg" alt="" draggable="false" aria-hidden="true" />
      </button>
      <button type="button" class="stage-tools__btn" data-action="cycle-stage-image" aria-label="Switch stage image">
        <img src="/Icons/stage/switch-icon.svg" alt="" draggable="false" aria-hidden="true" />
      </button>
    </div>
  `
}

function stageFrameOverlayHtml() {
  return `
    <div class="stage-frame-overlay" aria-hidden="true">
      <span class="frame-line frame-line-top"></span>
      <span class="frame-line frame-line-bottom"></span>
      <span class="frame-line frame-line-left"></span>
    </div>
    <div class="stage-frame-marks" aria-hidden="true">
      <span class="corner corner-1"></span>
      <span class="corner corner-2"></span>
      <span class="corner corner-3"></span>
      <span class="corner corner-4"></span>
    </div>
  `
}

function stageHtml() {
  if (!useStageIframe()) {
    return `
    <div class="viewport" data-region="stage">
      <div id="artboard" class="artboard">
        <div class="stepscreen-embed-shell" data-stage-shell>
          <img
            class="stepscreen-embed stepscreen-stage-image"
            src="${currentStageImage()}"
            alt="Stage preview"
            draggable="false"
          />
        </div>
      </div>
    </div>
  `
  }

  ensureEmbedUrls()
  return `
    <div class="viewport" data-region="stage">
      <div id="artboard" class="artboard">
        <div class="stepscreen-embed-shell" data-stage-shell>
          <div class="stepscreen-embed-crossfade" style="--stage-step-crossfade-ms:${STAGE_STEP_CROSSFADE_MS}ms">
            ${[0, 1]
              .map(
                (slot) => `
              <div class="stepscreen-embed-layer${slot === state.embedSlot ? ' is-active' : ''}" data-embed-slot="${slot}">
                <iframe
                  class="stepscreen-embed"
                  src="${state.embedUrls[slot]}"
                  title="Atencium steps"
                  allow="fullscreen"
                  loading="eager"
                  referrerpolicy="strict-origin-when-cross-origin"
                  data-embed-frame="${slot}"
                ></iframe>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  `
}

function fullscreenHtml() {
  if (!state.fullscreenOpen) return ''
  if (!useStageIframe()) {
    return `
    <div class="luna-fullscreen-overlay" data-region="fullscreen" role="dialog" aria-modal="true" aria-label="Full screen preview">
      <button type="button" class="luna-fullscreen-overlay__backdrop" data-action="close-fullscreen" aria-label="Close full screen"></button>
      <div class="luna-fullscreen-overlay__layout">
        <button type="button" class="luna-fullscreen-overlay__close" data-action="close-fullscreen" aria-label="Close">Close</button>
        <img class="luna-fullscreen-overlay__frame stepscreen-stage-image" src="${currentStageImage()}" alt="Stage preview" draggable="false" />
      </div>
    </div>
  `
  }
  const src = stageEmbedUrlForStep(state.projectId, state.stepId)
  return `
    <div class="luna-fullscreen-overlay" data-region="fullscreen" role="dialog" aria-modal="true" aria-label="Full screen preview">
      <button type="button" class="luna-fullscreen-overlay__backdrop" data-action="close-fullscreen" aria-label="Close full screen"></button>
      <div class="luna-fullscreen-overlay__layout">
        <button type="button" class="luna-fullscreen-overlay__close" data-action="close-fullscreen" aria-label="Close">Close</button>
        <iframe class="luna-fullscreen-overlay__frame" src="${src}" title="Atencium steps fullscreen" allow="fullscreen"></iframe>
      </div>
    </div>
  `
}

function loadingHtml() {
  const progress = state.loadProgress
  const sweepMs = Math.round(
    Math.min(SWEEP_MS_MAX, Math.max(SWEEP_MS_MIN, window.innerWidth * SWEEP_MS_PER_PX)),
  )
  const progressEndMs = PROGRESS_MS + PAUSE_MS
  const fadeDelayMs = progressEndMs + sweepMs + HOLD_MS

  return `
    <div
      class="loadscreen loadscreen--bg-ready loadscreen--sequence"
      role="progressbar"
      aria-valuenow="${progress}"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Loading Waypoint"
      style="--loadscreen-progress-end:${progressEndMs}ms;--loadscreen-sweep-ms:${sweepMs}ms;--loadscreen-fade-ms:${FADE_MS}ms;--loadscreen-fade-delay:${fadeDelayMs}ms"
      data-loadscreen
    >
      <div class="loadscreen__bg" aria-hidden="true"></div>
      <div class="loadscreen__chrome">
        <div class="loadscreen__progress" aria-hidden="true">
          <div class="loadscreen__bar-track"><div class="loadscreen__bar" style="height:${progress}%"></div></div>
          <div class="loadscreen__marker" style="top:${progress}%">
            <div class="loadscreen__percent-stack">
              <img class="loadscreen__tracker" src="/loadingscrn/tracker-rect.svg" alt="" width="11" height="30" draggable="false" />
              <p class="loadscreen__percent">[${progress}%:]</p>
              <img class="loadscreen__smollwrd" src="/loadingscrn/smollwrd.png" alt="" width="176" height="35" draggable="false" />
            </div>
            <div class="loadscreen__hline"></div>
          </div>
        </div>
        <div class="loadscreen__brand">
          <div class="loadscreen__icons" aria-hidden="true">
            <img class="loadscreen__icon-img" src="/loadingscrn/website-icon.svg" alt="" width="36" height="36" draggable="false" />
            <img class="loadscreen__icon-img" src="/loadingscrn/waypoint-icon.svg" alt="" width="36" height="36" draggable="false" />
          </div>
          <p class="loadscreen__status">// Loading Waypoint...</p>
        </div>
      </div>
      <div class="loadscreen__sweep" aria-hidden="true"></div>
    </div>
  `
}

function appHtml() {
  return `
    <div class="app-shell${state.loaded ? ' is-ready' : ''}" data-app-shell>
      <div class="luna-root">
        <div class="luna-canvas-row">
          ${navbarHtml()}
          <div class="waypoint-horizontal">
            <div class="main-side-left" aria-hidden="true"></div>
            <div class="main-center">
              <div class="luna-design-surface">${stageHtml()}</div>
              ${stageToolsHtml()}
              ${stageFrameOverlayHtml()}
              ${stepsInfoDockHtml()}
            </div>
            <div class="main-side-right" aria-hidden="true"></div>
          </div>
        </div>
        <div data-region="fullscreen-host">${fullscreenHtml()}</div>
      </div>
    </div>
  `
}

function replaceRegion(selector, html) {
  const el = root.querySelector(selector)
  if (!el) return
  const wrap = document.createElement('div')
  wrap.innerHTML = html.trim()
  const next = wrap.firstElementChild
  if (next) el.replaceWith(next)
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function waitForAnimation(controls) {
  if (!controls) return Promise.resolve()
  if (controls.finished) return controls.finished
  return Promise.resolve(controls)
}

function panelAnimateItems(panel) {
  if (!panel) return []
  return [...panel.querySelectorAll('[data-panel-animate]')]
}

function clearPanelInlineMotion(items) {
  items.forEach((el) => {
    el.style.opacity = ''
    el.style.transform = ''
  })
}

async function animatePanelLeave(panel, dir) {
  const items = panelAnimateItems(panel)
  const targets = items.length ? items : [panel]
  panel.classList.add('is-panel-animating')
  panel.style.pointerEvents = 'none'
  await waitForAnimation(
    animate(
      [...targets].reverse(),
      {
        opacity: [1, 0],
        transform: ['translateX(0)', `translateX(${-PANEL_SHIFT_REM * dir}rem)`],
      },
      {
        delay: stagger(0.03),
        duration: PANEL_LEAVE_MS,
        easing: PANEL_EASE_LEAVE,
      },
    ),
  )
}

async function animatePanelEnter(panel, dir) {
  const items = panelAnimateItems(panel)
  const targets = items.length ? items : [panel]
  panel.classList.add('is-panel-animating')
  targets.forEach((el) => {
    el.style.opacity = '0'
    el.style.transform = `translateX(${PANEL_SHIFT_REM * dir}rem)`
  })
  await waitForAnimation(
    animate(
      targets,
      {
        opacity: [0, 1],
        transform: [`translateX(${PANEL_SHIFT_REM * dir}rem)`, 'translateX(0)'],
      },
      {
        delay: stagger(PANEL_STAGGER_S),
        duration: PANEL_ENTER_MS,
        easing: PANEL_EASE_ENTER,
      },
    ),
  )
  clearPanelInlineMotion(targets)
  panel.classList.remove('is-panel-animating')
}

async function transitionHeaderMode(nextMode) {
  if (nextMode !== 'information' && nextMode !== 'waypoint-select') return
  if (state.panelTransitioning) {
    state.pendingHeaderMode = nextMode
    return
  }
  if (state.headerMode === nextMode) return

  const dir = nextMode === 'waypoint-select' ? 1 : -1
  const outgoing = root.querySelector('[data-region="steps-info"]')
  state.headerMode = nextMode
  state.panelTransitioning = true
  replaceRegion('[data-region="header-switch"]', headerSwitchHtml())

  if (outgoing && !prefersReducedMotion()) {
    try {
      await animatePanelLeave(outgoing, dir)
    } catch {
      /* swap even if the leave animation is interrupted */
    }
  }

  replaceRegion('[data-region="steps-info"]', stepsInfoPanel())
  const incoming = root.querySelector('[data-region="steps-info"]')
  if (incoming && !prefersReducedMotion()) {
    await animatePanelEnter(incoming, dir)
  }

  state.panelTransitioning = false
  const queued = state.pendingHeaderMode
  state.pendingHeaderMode = null
  if (state.chromeDirty) {
    state.chromeDirty = false
    patchChrome()
  }
  if (queued && queued !== state.headerMode) {
    await transitionHeaderMode(queued)
  }
}

function projectCardAssets(isActive) {
  return {
    circle: isActive
      ? '/Icons/project-select/small-circle.svg'
      : '/Icons/project-select/inactive-circle.svg',
    accent: '/Icons/project-select/accent-dsn.svg',
  }
}

function syncProjectCard(card, isActive) {
  const assets = projectCardAssets(isActive)
  card.classList.toggle('is-active', isActive)
  card.setAttribute('aria-current', isActive ? 'true' : 'false')
  const circle = card.querySelector('.project-select__corner-circle')
  const accent = card.querySelector('.project-select__accent')
  const titleAccent = card.querySelector('.project-select__title-accent')
  if (circle) circle.setAttribute('src', assets.circle)
  if (accent) accent.setAttribute('src', assets.accent)
  if (titleAccent) titleAccent.setAttribute('src', assets.accent)
}

function animateProjectSwap(activating, deactivating) {
  if (prefersReducedMotion()) return

  if (deactivating && deactivating !== activating) {
    animate(
      deactivating,
      {
        transform: ['scale(1)', 'scale(0.985)', 'scale(1)'],
        opacity: [1, 0.88, 1],
      },
      { duration: 0.22, easing: [0.4, 0, 1, 1] },
    )
  }

  if (activating) {
    animate(
      activating,
      {
        transform: ['scale(0.97)', 'scale(1.02)', 'scale(1)'],
        opacity: [0.82, 1, 1],
      },
      { duration: 0.32, easing: [0.22, 1, 0.36, 1] },
    )
  }
}

function selectProject(id) {
  if (!WAYPOINT_PROJECTS.some((p) => p.id === id)) return
  const same = state.projectId === id
  if (same && useStageIframe()) return

  const prevId = state.projectId
  if (!same) {
    state.projectId = id
    state.stepId = flowStepsFor(id)[0].id
    state.managerOpen = false
    const hash = `#${state.stepId}`
    if (window.location.hash !== hash) {
      const url = new URL(window.location.href)
      url.hash = hash
      history.pushState(null, '', url)
    }
    state.embedSlot = 0
    state.embedUrls = ['', '']
    state.pendingEmbedSlot = null
    state.pendingEmbedSrc = null
  }

  setEmbedProjectId(state.projectId)
  state.stageSource = 'iframe'
  ensureEmbedUrls()

  const list = root.querySelector('.project-select__list')
  const canAnimateCards =
    !same &&
    list &&
    state.headerMode === 'waypoint-select' &&
    !state.panelTransitioning

  if (canAnimateCards) {
    let activating = null
    let deactivating = null
    list.querySelectorAll('.project-select__card').forEach((card) => {
      const cardId = card.getAttribute('data-project')
      const nowActive = cardId === id
      const wasActive = card.classList.contains('is-active')
      if (nowActive && !wasActive) activating = card
      if (!nowActive && wasActive) deactivating = card
      syncProjectCard(card, nowActive)
    })
    if (!activating) activating = list.querySelector(`[data-project="${id}"]`)
    if (!deactivating) deactivating = list.querySelector(`[data-project="${prevId}"]`)
    animateProjectSwap(activating, deactivating)
    replaceRegion('[data-region="navbar"]', navbarHtml())
  } else {
    patchChrome()
  }

  patchStage()
  patchFullscreen()
}

function patchChrome() {
  if (state.panelTransitioning) {
    state.chromeDirty = true
    replaceRegion('[data-region="navbar"]', navbarHtml())
    return
  }
  replaceRegion('[data-region="navbar"]', navbarHtml())
  replaceRegion('[data-region="steps-info-dock"]', stepsInfoDockHtml())
}

function stepsInfoHeaderHtml() {
  const step = currentStep()
  const stepIndex = currentStepIndex()
  return `
    <header class="steps-info__header" data-panel-animate data-region="steps-info-header">
      <img class="steps-info__mark" src="${stepMarkIconForStep(step.id)}" alt="" draggable="false" aria-hidden="true" />
      <div class="steps-info__step-text">
        <h2 class="steps-info__title">${step.title}</h2>
        <p class="steps-info__subtitle">Step ${stepIndex + 1}</p>
      </div>
    </header>
  `
}

function stepsInfoCopyHtml() {
  const step = currentStep()
  const onScreen = step.onScreen ?? [step.body]
  const movingForward = step.movingForward ?? ''
  return `
    <div class="steps-info__copy-col" data-panel-animate data-region="steps-info-copy">
      <div class="steps-info__block">
        <div class="steps-info__block-head">
          <div class="steps-info__block-title">
            <img class="steps-info__bullet" src="/Icons/steps-info/title-icon.svg" alt="" draggable="false" aria-hidden="true" />
            <h3 class="steps-info__block-label">On Screen</h3>
          </div>
          <div class="steps-info__block-rule-row" aria-hidden="true">
            <span class="steps-info__block-rule"></span>
            <img class="steps-info__block-icon" src="/Icons/steps-info/line-icn.svg" alt="" width="9" height="9" draggable="false" />
          </div>
        </div>
        ${onScreen.map((p) => `<p class="steps-info__copy">${p}</p>`).join('')}
      </div>

      <div class="steps-info__block">
        <div class="steps-info__block-head">
          <div class="steps-info__block-title">
            <img class="steps-info__bullet" src="/Icons/steps-info/title-icon.svg" alt="" draggable="false" aria-hidden="true" />
            <h3 class="steps-info__block-label">Moving Forward</h3>
          </div>
          <div class="steps-info__block-rule-row" aria-hidden="true">
            <span class="steps-info__block-rule"></span>
            <img class="steps-info__block-icon" src="/Icons/steps-info/line-icn.svg" alt="" width="9" height="9" draggable="false" />
          </div>
        </div>
        <p class="steps-info__copy">${movingForward}</p>
      </div>
    </div>
  `
}

function patchInfoStepSelection(prevStepId) {
  replaceRegion('[data-region="navbar"]', navbarHtml())
  replaceRegion('[data-region="header-switch"]', headerSwitchHtml())

  const panel = root.querySelector('.steps-info:not(.steps-info--select)')
  if (!panel) {
    patchChrome()
    return
  }

  let activating = null
  let deactivating = null
  panel.querySelectorAll('.steps-info__step').forEach((tab) => {
    const id = tab.getAttribute('data-step')
    const nowActive = id === state.stepId
    const wasActive = tab.classList.contains('is-active')
    if (nowActive && !wasActive) activating = tab
    if (!nowActive && wasActive) deactivating = tab
    tab.classList.toggle('is-active', nowActive)
    tab.setAttribute('aria-current', nowActive ? 'step' : 'false')
  })

  replaceRegion('[data-region="steps-info-header"]', stepsInfoHeaderHtml())
  replaceRegion('[data-region="steps-info-copy"]', stepsInfoCopyHtml())
  animateInfoStepSelect(activating, deactivating || panel.querySelector(`[data-step="${prevStepId}"]`))
}

function animateInfoStepSelect(activating, deactivating) {
  if (prefersReducedMotion()) return
  const panel = root.querySelector('.steps-info:not(.steps-info--select)')
  if (!panel) return

  const activeTab =
    activating || panel.querySelector('.steps-info__step.is-active')
  const content = panel.querySelectorAll(
    '[data-region="steps-info-header"], [data-region="steps-info-copy"]',
  )

  if (deactivating && deactivating !== activeTab) {
    animate(
      deactivating,
      { transform: ['scale(1)', 'scale(0.985)', 'scale(1)'], opacity: [1, 0.88, 1] },
      { duration: 0.2, easing: [0.4, 0, 1, 1] },
    )
  }

  if (activeTab) {
    animate(
      activeTab,
      {
        transform: ['scale(0.96)', 'scale(1.025)', 'scale(1)'],
        opacity: [0.72, 1, 1],
      },
      { duration: 0.3, easing: [0.22, 1, 0.36, 1] },
    )
  }

  if (content.length) {
    animate(
      content,
      { opacity: [0, 1], transform: ['translateY(0.35rem)', 'translateY(0)'] },
      { delay: stagger(0.04), duration: 0.24, easing: [0.22, 1, 0.36, 1] },
    )
  }
}

function patchFullscreen() {
  const host = root.querySelector('[data-region="fullscreen-host"]')
  if (host) host.innerHTML = fullscreenHtml()
  const shell = root.querySelector('[data-stage-shell]')
  if (shell) shell.style.visibility = state.stageEmbedVisible ? '' : 'hidden'
}

function bindEmbedFrames() {
  if (!useStageIframe()) return
  root.querySelectorAll('iframe[data-embed-frame]').forEach((frame) => {
    const slot = Number(frame.getAttribute('data-embed-frame'))
    frame.addEventListener('load', () => onEmbedReady(slot))
  })
  syncEmbedLayers()
}

function patchStage() {
  replaceRegion('[data-region="stage"]', stageHtml())
  replaceRegion('[data-region="stage-tools"]', stageToolsHtml())
  bindEmbedFrames()
}

function mount() {
  if (useStageIframe()) ensureEmbedUrls()
  root.innerHTML = `${appHtml()}${state.loaded ? '' : loadingHtml()}`
  state.mounted = true
  bindEmbedFrames()
}

function onRootClick(event) {
  const target = event.target.closest('[data-action]')
  if (!target || !root.contains(target)) {
    if (state.managerOpen && !event.target.closest('.navbar-manager-dropdown')) {
      state.managerOpen = false
      patchChrome()
    }
    return
  }

  const action = target.getAttribute('data-action')
  if (action === 'reload-page') {
    window.location.reload()
    return
  }
  if (action === 'select-step') {
    goToStep(target.getAttribute('data-step'))
    return
  }
  if (action === 'view-case-study') {
    return
  }
  if (action === 'toggle-manager') {
    state.managerOpen = !state.managerOpen
    patchChrome()
    return
  }
  if (action === 'select-project') {
    const id = target.getAttribute('data-project')
    if (!WAYPOINT_PROJECTS.some((p) => p.id === id)) return
    if (state.projectId === id) return
    selectProject(id)
    return
  }
  if (action === 'set-header-mode') {
    const mode = target.getAttribute('data-mode')
    void transitionHeaderMode(mode)
    return
  }
  if (action === 'open-fullscreen') {
    state.fullscreenOpen = true
    state.stageEmbedVisible = false
    patchFullscreen()
    return
  }
  if (action === 'view-info') {
    return
  }
  if (action === 'toggle-stage-iframe') {
    toggleStageIframe()
    return
  }
  if (action === 'cycle-stage-image') {
    cycleStageImage()
    return
  }
  if (action === 'close-fullscreen') {
    state.fullscreenOpen = false
    state.stageEmbedVisible = true
    patchFullscreen()
  }
}

function onKeyDown(event) {
  if (event.key !== 'Escape') return
  if (state.fullscreenOpen) {
    state.fullscreenOpen = false
    state.stageEmbedVisible = true
    patchFullscreen()
  } else if (state.managerOpen) {
    state.managerOpen = false
    patchChrome()
  }
}

const PROJECT_SELECT_ASSETS = [
  '/Icons/project-select/inactive-bg.png',
  '/Icons/project-select/active-crd-bg.png',
  '/Icons/project-select/small-circle.svg',
  '/Icons/project-select/inactive-circle.svg',
  '/Icons/project-select/accent-dsn.svg',
  '/Icons/project-select/inactive-accent.svg',
]

function preloadProjectSelectAssets() {
  PROJECT_SELECT_ASSETS.forEach((src) => {
    const img = new Image()
    img.src = src
  })
}

function runLoadscreen() {
  document.documentElement.classList.add('loadscreen-active')
  const start = performance.now()
  const sweepMs = Math.round(
    Math.min(SWEEP_MS_MAX, Math.max(SWEEP_MS_MIN, window.innerWidth * SWEEP_MS_PER_PX)),
  )
  const fadeDelayMs = PROGRESS_MS + PAUSE_MS + sweepMs + HOLD_MS
  const totalMs = fadeDelayMs + FADE_MS

  const tick = (now) => {
    const t = Math.min(1, (now - start) / PROGRESS_MS)
    const eased = 1 - (1 - t) ** 2.2
    const next = Math.min(100, Math.max(0, Math.round(eased * 100)))
    if (next !== state.loadProgress) {
      state.loadProgress = next
      const bar = document.querySelector('.loadscreen__bar')
      const marker = document.querySelector('.loadscreen__marker')
      const percent = document.querySelector('.loadscreen__percent')
      const el = document.querySelector('[data-loadscreen]')
      if (bar) bar.style.height = `${next}%`
      if (marker) marker.style.top = `${next}%`
      if (percent) percent.textContent = `[${next}%:]`
      if (el) el.setAttribute('aria-valuenow', String(next))
    }
    if (t < 1) requestAnimationFrame(tick)
  }

  const img = new Image()
  img.src = LOADSCREEN_BG_URL
  requestAnimationFrame(tick)

  window.setTimeout(() => {
    document.documentElement.classList.remove('loadscreen-active')
    document.querySelector('[data-loadscreen]')?.classList.add('loadscreen--releasing')
    root.querySelector('[data-app-shell]')?.classList.add('is-ready')
  }, fadeDelayMs)

  window.setTimeout(() => {
    state.loaded = true
    state.loadProgress = 100
    document.querySelector('[data-loadscreen]')?.remove()
  }, totalMs + 80)
}

function boot() {
  setEmbedProjectId(state.projectId)
  bindDocumentScale()
  preloadProjectSelectAssets()
  mount()
  runLoadscreen()

  root.addEventListener('click', onRootClick)
  document.addEventListener('keydown', onKeyDown)
  window.addEventListener('hashchange', () => {
    goToStep(polarFlowIdFromHash(window.location.hash, state.projectId), { syncHash: false })
  })
  window.addEventListener('popstate', () => {
    goToStep(polarFlowIdFromHash(window.location.hash, state.projectId), { syncHash: false })
  })

  window.addEventListener('message', (event) => {
    if (!useStageIframe()) return
    if (event.origin !== getStageEmbedOrigin(state.projectId)) return
    if (event.data?.type !== STAGE_EMBED_STEP_CHANGED) return
    const steps = flowSteps()
    const fromRoute =
      typeof event.data.route === 'string'
        ? polarFlowIdFromHash(`#/${event.data.route}`, state.projectId)
        : null
    const id =
      fromRoute && steps.some((s) => s.id === fromRoute)
        ? fromRoute
        : Number.isFinite(Number(event.data.step)) &&
            Number(event.data.step) >= 1 &&
            Number(event.data.step) <= steps.length
          ? String(event.data.step)
          : null
    if (!id) return
    goToStep(id)
  })

  window.setInterval(() => {
    if (useStageIframe()) requestStageEmbedStep()
  }, 400)
}

boot()
