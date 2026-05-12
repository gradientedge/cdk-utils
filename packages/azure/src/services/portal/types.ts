import { DashboardArgs } from '@pulumi/azure-native/portal/index.js'

/**
 * Client metadata for dashboard pane rendering
 * @category Interface
 */
export type PaneClient = {
  /** Client display name */
  name: string
  /** Client domain */
  domain: string
}

/**
 * Template configuration for rendering client rows in a pane
 * @category Interface
 */
export type PaneClientTemplate = {
  /** Template string for each row */
  rowTemplate: string
  /** Optional prefix before the first row */
  prefix?: string
  /** Separator between rows */
  separator?: string
  /** Trailing content after the last row */
  trailing?: string
  /** Optional suffix after all rows */
  suffix?: string
}

/**
 * Structure of a parsed YAML pane template file
 * @category Interface
 */
export type PaneTemplate = {
  /** Pane dimensions for dashboard layout */
  dimensions: { height: number }
  /** Required properties that must be provided for template substitution */
  properties: Record<string, string>
  /** Required variables that must be provided for template substitution */
  variables: Record<string, string>
  /** The Lodash-compatible template string */
  template: string
}

/**
 * Result of checking for missing required keys in a template
 * @category Interface
 */
export type MissingKeys = {
  /** List of missing key names */
  keys: Array<string>
  /** Whether any required keys are missing */
  hasMissingKeys: boolean
}

/**
 * Configuration for a single dashboard pane
 * @category Interface
 */
export type Pane = {
  /** Pane template identifier (corresponds to a YAML filename) */
  id: string
  /** Optional pane-specific properties to pass to the template */
  properties?: Record<string, string | number | Array<string | number>>
}

/**
 * Filter configuration for dashboard time range and locale
 * @category Interface
 */
export type Filter = {
  /** Locale for the dashboard display (e.g. 'en-us') */
  locale?: string
  /** Time format for the dashboard (e.g. 'utc') */
  timeFormat?: string
  /** Time granularity for the dashboard (e.g. 'auto') */
  timeGranularity?: string
  /** Relative time range for the dashboard (e.g. '4h') */
  timeRelative?: string
}

/**
 * Parameters for rendering a dashboard from pane templates
 * @category Interface
 */
export type RenderParams = {
  /** List of panes to render in the dashboard */
  panes: Array<Pane>
  /** Variables to substitute into pane templates */
  variables: Record<string, any>
  /** Optional properties to pass to pane templates */
  properties?: Record<string, any>
  /** Optional filter configuration for the dashboard */
  filter?: Filter
}

/** @category Interface */
export interface DashboardRenderer {
  /**
   * @summary Render a dashboard template with the given parameters
   * @param params the render parameters including panes, variables, and filters
   */
  render(params: RenderParams): string
  /**
   * @summary Render a dashboard template and write the output to a file
   * @param filename the output file path
   * @param params the render parameters including panes, variables, and filters
   */
  renderToFile(filename: string, params: RenderParams): string
}

/**
 * Properties for creating an Azure Portal dashboard
 * @see [Pulumi Azure Native Portal Dashboard]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/portal/dashboard/}
 * @category Interface
 */
export interface PortalDashboardProps extends DashboardArgs {
  /** Display name shown in the Azure Portal */
  displayName: string
  /** List of pane configurations to render in the dashboard */
  panes: Array<Pane>
  /** Variables to substitute into pane templates */
  variables: Record<string, string>
  /** Optional filter configuration for the dashboard */
  filter?: Filter
  /** When false, skips dashboard creation */
  enabled?: boolean
}
