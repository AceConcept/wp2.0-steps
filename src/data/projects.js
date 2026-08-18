import { WAYPOINT_MODES } from './steps.js'

export const WAYPOINT_PROJECTS = Object.values(WAYPOINT_MODES).map((mode) => ({
  id: mode.id,
  kind: mode.kind,
  title: mode.title,
  subtitle: mode.subtitle,
  description: mode.description,
}))
