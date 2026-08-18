/** Shared stage preview images (image-swap mode). */
export const STAGE_PLACEHOLDER_IMAGE = '/stage/0106.73d441.jpg'
export const STAGE_PREVIEW_IMAGES = [
  STAGE_PLACEHOLDER_IMAGE,
  '/stage/HP0_KKgbMAELkUu.jpeg',
]

export const DEFAULT_PROJECT_ID = 'steps-waypoint'

const STEP_IMAGE_FILES = {
  1: 'Node-StepOne.png',
  2: 'Node-steptwo.png',
}

const STEP_MARK_ICONS = {
  1: '/Icons/steps-info/step-1-icon.svg',
  2: '/Icons/steps-info/step-2-icon.svg',
  3: '/Icons/steps-info/step-3-icn.svg',
  4: '/Icons/steps-info/step-4-icon.svg',
}

function stepImagePath(n) {
  const file = STEP_IMAGE_FILES[n] ?? STEP_IMAGE_FILES[1]
  const base = `/step_imgs/${encodeURIComponent(file)}`
  const v =
    typeof __STEP_IMG_VER__ !== 'undefined' && __STEP_IMG_VER__ ? __STEP_IMG_VER__ : ''
  return v ? `${base}?v=${encodeURIComponent(v)}` : base
}

function buildFlow(mode) {
  return mode.stepCopy.map((copy, i) => {
    const id = String(i + 1)
    return {
      id,
      title: mode.stepTitles[i],
      body: copy.onScreen[0],
      onScreen: copy.onScreen,
      movingForward: copy.movingForward,
      navLabel: mode.stepTitles[i],
      navClass: `step-${id}`,
      iframePath: mode.iframePath[id],
      iframeRoute: mode.iframeRoutes?.[id] ?? null,
    }
  })
}

function buildSidebar(steps, swatches) {
  return steps.map((step, i) => {
    const n = i + 1
    const imageUrl = stepImagePath(n)
    return {
      id: step.id,
      label: step.title,
      step: step.title,
      title: step.title,
      description: step.body,
      previewDescription: '-',
      swatch: swatches[i] ?? swatches[0],
      thumbUrl: imageUrl,
      heroImageUrl: imageUrl,
    }
  })
}

const STEPS_MODE = {
  id: 'steps-waypoint',
  kind: 'Waypoint',
  title: 'Step Waypoint',
  subtitle: 'Flow',
  crumb: 'steps-waypoint',
  description:
    'Four-step slot flow. Story column, sidebar, jump ahead, and free navigation stay in sync with the live iframe.',
  embedOrigin: 'https://steps-project-slot.vercel.app',
  urlStyle: 'hash',
  stepTitles: ['Story Column', 'Waypoint Sidebar', 'Jump Ahead', 'Move Freely'],
  iframePath: { 1: '#1', 2: '#2', 3: '#3', 4: '#4' },
  swatches: ['#e8e4f0', '#cab6e0', '#e8e4f0', '#cab6e0'],
  stepCopy: [
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
  ],
}

const POLAR_MODE = {
  id: 'polar-systems',
  kind: 'Waypoint',
  title: 'Polar Systems',
  subtitle: 'Cyber Security',
  crumb: 'polar-systems',
  description:
    'Anomaly catalog, incident graph, and host telemetry for Case #8846 on db-core-02.internal.',
  embedOrigin: 'https://polarsysv2.guildconcept.workers.dev',
  urlStyle: 'polar-hash',
  stepTitles: ['Anomaly', 'Incident', 'Monitor'],
  iframePath: { 1: '#/anomaly', 2: '#/incident', 3: '#/monitor' },
  iframeRoutes: { 1: 'anomaly', 2: 'incident', 3: 'monitor' },
  routeToStep: { anomaly: '1', incident: '2', monitor: '3' },
  swatches: ['#e8e4f0', '#cab6e0', '#dcd4ec'],
  stepCopy: [
    {
      onScreen: [
        'The iframe opens on the anomaly catalog. Leo2.0Y has already ranked the board, and Case #8846 on db-core-02.internal is sitting at the top as a critical.',
        'This is the intake view: host, title, severity, and scan time for every live correlation. The first card is the one this flow follows.',
      ],
      movingForward:
        'Click DNS Loop & Port Scan Correlation in the iframe to open the incident graph.',
    },
    {
      onScreen: [
        'The incident view maps Case #8846 as a node graph. Internal and external hosts show lateral movement and how strongly each hop is correlated.',
        'Time-based charts on the same screen mark when the scan loop escalated. The db-core-02.internal node is the path forward.',
      ],
      movingForward:
        'Click the db-core-02.internal node, then View Host Telemetry to open the monitor.',
    },
    {
      onScreen: [
        'Monitor is the containment desk. Host telemetry is on screen, and the iframe offers AI-generated actions such as isolate host or replay traffic.',
        'This is the last beat of the Polar Systems run. The catalog, the graph, and the host view are one case told in three screens.',
      ],
      movingForward:
        'Run an action in the iframe, or step back to incident if you need the graph again.',
    },
  ],
}

const LUNA_MODE = {
  id: 'luna-base',
  kind: 'Waypoint',
  title: 'Luna Base',
  subtitle: 'Editor',
  crumb: 'luna-base',
  description:
    'Code editor origin, installed extensions, and the Python Environments download flow.',
  embedOrigin: 'https://luna-code-editor.guildconcept.workers.dev',
  urlStyle: 'path',
  stepTitles: ['Code Editor Origin', 'Extensions Page', 'Python Environs'],
  iframePath: {
    1: '/',
    2: '/extensions',
    3: '/extensions?extDetail=python-environments',
  },
  swatches: ['#e8e4f0', '#cab6e0', '#dcd4ec'],
  stepCopy: [
    {
      onScreen: [
        'The iframe is the Luna code editor. Explorer, tabs, and the agent chat sit in one workbench, scaled to the stage.',
        'This is the origin of the install flow. The left aside is how you leave the editor without closing the file.',
      ],
      movingForward:
        'Select the third aside tab in the iframe — Extensions — to open the installed list.',
    },
    {
      onScreen: [
        'Extensions lists what is already installed. Python Environments is the update this run is meant to fetch.',
        'The panel is the catalog inside Luna, not a separate app. Picking a row opens its detail without leaving the editor chrome.',
      ],
      movingForward: 'Select Python Environments to open the detail drawer and continue.',
    },
    {
      onScreen: [
        'The Python Environments detail is open on top of the list. Copy, version, and Download live in this drawer.',
        'Download installs the update and should raise the confirmation pop-up that ends the flow.',
      ],
      movingForward:
        'Click Download in the iframe to finish, or step back to the list if you need another extension.',
    },
  ],
}

export const WAYPOINT_MODES = {
  [STEPS_MODE.id]: STEPS_MODE,
  [POLAR_MODE.id]: POLAR_MODE,
  [LUNA_MODE.id]: LUNA_MODE,
}

const FLOW_BY_PROJECT = Object.fromEntries(
  Object.values(WAYPOINT_MODES).map((mode) => [mode.id, buildFlow(mode)]),
)

const SIDEBAR_BY_PROJECT = Object.fromEntries(
  Object.values(WAYPOINT_MODES).map((mode) => [
    mode.id,
    buildSidebar(FLOW_BY_PROJECT[mode.id], mode.swatches),
  ]),
)

export function getWaypointMode(projectId) {
  return WAYPOINT_MODES[projectId] ?? WAYPOINT_MODES[DEFAULT_PROJECT_ID]
}

export function flowStepsFor(projectId) {
  return FLOW_BY_PROJECT[projectId] ?? FLOW_BY_PROJECT[DEFAULT_PROJECT_ID]
}

export function flowSidebarItemsFor(projectId) {
  return SIDEBAR_BY_PROJECT[projectId] ?? SIDEBAR_BY_PROJECT[DEFAULT_PROJECT_ID]
}

export function getStageEmbedOrigin(projectId) {
  return getWaypointMode(projectId).embedOrigin.replace(/\/$/, '')
}

export function stageEmbedUrlForStep(projectId, stepId) {
  const mode = getWaypointMode(projectId)
  const origin = mode.embedOrigin.replace(/\/$/, '')
  const path = mode.iframePath[stepId] ?? mode.iframePath[1]
  if (mode.urlStyle === 'polar-hash') return `${origin}/${path}`
  if (mode.urlStyle === 'path') return `${origin}${path}`
  return `${origin}${path}`
}

export function polarFlowIdFromHash(hash, projectId = DEFAULT_PROJECT_ID) {
  const steps = flowStepsFor(projectId)
  const ids = steps.map((s) => s.id)
  const mode = getWaypointMode(projectId)
  const segment = String(hash || '')
    .replace(/^#/, '')
    .replace(/^\//, '')
    .trim()
  if (ids.includes(segment)) return segment
  if (mode.routeToStep?.[segment]) return mode.routeToStep[segment]
  return ids[0] ?? '1'
}

export function embedExtrasForStep(projectId, stepId) {
  const route = getWaypointMode(projectId).iframeRoutes?.[stepId]
  return route ? { route } : {}
}

export function stepMarkIconForStep(id) {
  return STEP_MARK_ICONS[id] ?? STEP_MARK_ICONS[1]
}

/** Default (Step Waypoint) flow — used only as a fallback. */
export const FLOW_STEPS = FLOW_BY_PROJECT[DEFAULT_PROJECT_ID]
export const FLOW_SIDEBAR_ITEMS = SIDEBAR_BY_PROJECT[DEFAULT_PROJECT_ID]
export const FLOW_STEP_IDS = FLOW_STEPS.map((s) => s.id)
export const STAGE_EMBED_ORIGIN = STEPS_MODE.embedOrigin
