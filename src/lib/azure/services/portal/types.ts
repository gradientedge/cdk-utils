import { DashboardArgs } from '@pulumi/azure-native/portal/index.js'

export type PaneTemplate = {
  dimensions: { height: number }
  properties: Record<string, string>
  variables: Record<string, string>
  template: string
}

export type MissingKeys = {
  keys: Array<string>
  hasMissingKeys: boolean
}

export type Pane = {
  id: string
  properties?: Record<string, string | number | Array<string | number>>
}

export type Filter = {
  locale?: string
  timeFormat?: string
  timeGranularity?: string
  timeRelative?: string
}

export type RenderParams = {
  panes: Array<Pane>
  variables: Record<string, any>
  properties?: Record<string, any>
  filter?: Filter
}

export interface DashboardRenderer {
  render(params: RenderParams): string
  renderToFile(filename: string, params: RenderParams): string
}

export interface PortalDashboardProps extends DashboardArgs {
  displayName: string
  panes: Array<Pane>
  variables: Record<string, string>
  filter?: Filter
  enabled?: boolean
}
