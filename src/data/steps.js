/** Flow steps + sidebar cards (ids `1`…`4`). */

export const FLOW_STEP_IDS = ['1', '2', '3', '4']

export const WAYPOINT_TITLE = 'Autonomous Search'

const STEP_COPY = [
  {
    onScreen: [
      'The iframe opens on the story of this flow. A step title and body sit in the center, while this column on the left carries the same beat.',
      'Change steps here or inside the frame and both stay in sync. The hash, the live app, and this panel move together.',
    ],
    movingForward:
      'Read the intro on screen, then open the sidebar so every waypoint in the run is visible at once.',
  },
  {
    onScreen: [
      'Every step also lives in the waypoint sidebar. If you lose your place, the list is the map back.',
      'The active card is the step on screen. Pick another to jump the iframe without using the arrows.',
    ],
    movingForward:
      'Once you can find any waypoint from the rail, try Start to skip ahead in the flow.',
  },
  {
    onScreen: [
      'Start jumps you forward in the sequence instead of walking one beat at a time.',
      'Use it when you already know the next beat and just need the iframe to catch up.',
    ],
    movingForward:
      'After the jump, use the arrows to confirm you can still move one step at a time.',
  },
  {
    onScreen: [
      'You can move back and forth at any time. Previous and next wrap, and this shell follows.',
      'Nothing in the flow is a dead end. Step 4 can return to 1, and 1 can step back to 4.',
    ],
    movingForward:
      'Walk the loop once more, then keep the iframe up while you tune this column.',
  },
]

export const STEP_TITLES = [
  'Story Column',
  'Waypoint Sidebar',
  'Jump Ahead',
  'Move Freely',
]

export const STEP_DESCRIPTIONS = STEP_COPY.map((copy) => copy.onScreen[0])

export const POLAR_SYS_HASH = Object.fromEntries(FLOW_STEP_IDS.map((id) => [id, `#${id}`]))

/**
 * Slot copy from steps-project-slot — maps 1:1 to iframe `#1`–`#4`.
 */
export const SLOT_STEP_TITLES = ['Step 1', 'Step 2', 'Step 3', 'Step 4']

export const SLOT_STEP_DESCRIPTIONS = [
  'The left story column introduces each step—title and description beside the live app in the center, kept in sync as you move through the flow.',
  'Each step is displayed within the waypoint sidebar. If you are lost you can easily find a waypoint.',
  'Clicking start will jump you ahead in the flow.',
  'Move back and forth at anytime.',
]

/** iframe target — https://steps-project-slot.vercel.app (`#1` … `#4`) */
export const STAGE_EMBED_ORIGIN = 'https://steps-project-slot.vercel.app'

export const STAGE_PLACEHOLDER_IMAGE = '/stage/0106.73d441.jpg'
export const STAGE_PREVIEW_IMAGES = [
  STAGE_PLACEHOLDER_IMAGE,
  '/stage/HP0_KKgbMAELkUu.jpeg',
]

const STEP_IMAGE_FILES = {
  1: 'Node-StepOne.png',
  2: 'Node-steptwo.png',
}

const SWATCHES = ['#e8e4f0', '#cab6e0', '#e8e4f0', '#cab6e0']

function stepImagePath(n) {
  const file = STEP_IMAGE_FILES[n] ?? STEP_IMAGE_FILES[1]
  const base = `/step_imgs/${encodeURIComponent(file)}`
  const v =
    typeof __STEP_IMG_VER__ !== 'undefined' && __STEP_IMG_VER__ ? __STEP_IMG_VER__ : ''
  return v ? `${base}?v=${encodeURIComponent(v)}` : base
}

export function getStageEmbedOrigin() {
  const envOrigin = import.meta.env.VITE_STAGE_EMBED_ORIGIN
  if (typeof envOrigin === 'string' && envOrigin.trim()) {
    return envOrigin.trim().replace(/\/$/, '')
  }
  return STAGE_EMBED_ORIGIN
}

export function stageEmbedUrlForStep(id) {
  const hash = POLAR_SYS_HASH[id] ?? '#1'
  return `${getStageEmbedOrigin()}${hash}`
}

export function polarFlowIdFromHash(hash) {
  const segment = String(hash || '')
    .replace(/^#/, '')
    .replace(/^\//, '')
    .trim()
  return FLOW_STEP_IDS.includes(segment) ? segment : '1'
}

const STEP_MARK_ICONS = {
  1: '/Icons/steps-info/step-1-icon.svg',
  2: '/Icons/steps-info/step-2-icon.svg',
  3: '/Icons/steps-info/step-3-icn.svg',
  4: '/Icons/steps-info/step-4-icon.svg',
}

export function stepMarkIconForStep(id) {
  return STEP_MARK_ICONS[id] ?? STEP_MARK_ICONS[1]
}

export const FLOW_STEPS = FLOW_STEP_IDS.map((id, i) => ({
  id,
  title: STEP_TITLES[i],
  body: STEP_DESCRIPTIONS[i],
  onScreen: STEP_COPY[i].onScreen,
  movingForward: STEP_COPY[i].movingForward,
  navLabel: `Step ${id}`,
  navClass: `step-${id}`,
  iframeHash: POLAR_SYS_HASH[id],
  iframeTitle: SLOT_STEP_TITLES[i],
  iframeDescription: SLOT_STEP_DESCRIPTIONS[i],
}))

export const FLOW_SIDEBAR_ITEMS = FLOW_STEPS.map((step, i) => {
  const n = i + 1
  const imageUrl = stepImagePath(n)
  return {
    id: step.id,
    label: step.title,
    step: step.title,
    title: step.title,
    description: step.body,
    previewDescription: '-',
    swatch: SWATCHES[i] ?? SWATCHES[0],
    thumbUrl: imageUrl,
    heroImageUrl: imageUrl,
  }
})
