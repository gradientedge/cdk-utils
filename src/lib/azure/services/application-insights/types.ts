import { ApplicationInsightsConfig } from '@cdktf/provider-azurerm/lib/application-insights/index.js'

export interface ApplicationInsightsProps extends Omit<ApplicationInsightsConfig, 'applicationType' | 'name'> {
  name?: string | undefined
  applicationType?: string | undefined
}
