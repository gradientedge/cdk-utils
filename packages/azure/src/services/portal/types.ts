import { DashboardArgs } from '@pulumi/azure-native/portal/index.js'

/** @category Interface */
export type PaneTemplate = {
  dimensions: { height: number }
  properties: Record<string, string>
  variables: Record<string, string>
  template: string
}

/** @category Interface */
export type MissingKeys = {
  keys: Array<string>
  hasMissingKeys: boolean
}

/** @category Interface */
export type Pane = {
  id: string
  properties?: Record<string, string | number | Array<string | number>>
}

/** @category Interface */
export type Filter = {
  locale?: string
  timeFormat?: string
  timeGranularity?: string
  timeRelative?: string
}

/** @category Interface */
export type RenderParams = {
  panes: Array<Pane>
  variables: Record<string, any>
  properties?: Record<string, any>
  filter?: Filter
}

/** @category Interface */
export interface DashboardRenderer {
  render(params: RenderParams): string
  renderToFile(filename: string, params: RenderParams): string
}

/** @category Interface */
export interface PortalDashboardProps extends DashboardArgs {
  displayName: string
  panes: Array<Pane>
  variables: Record<string, string>
  filter?: Filter
  enabled?: boolean
}
