import { ApplicationInsightsConfig } from '@cdktf/provider-azurerm/lib/application-insights'

export interface ApplicationInsightsProps extends Omit<ApplicationInsightsConfig, 'applicationType' | 'name'> {
  name?: string | undefined
  applicationType?: string | undefined
}
