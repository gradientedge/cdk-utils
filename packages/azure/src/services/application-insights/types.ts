import {
  ComponentArgs,
  ComponentCurrentBillingFeatureArgs,
  WorkbookArgs,
} from '@pulumi/azure-native/applicationinsights/index.js'

/** @category Interface */
export interface ComponentCurrentBillingFeatureProps extends ComponentCurrentBillingFeatureArgs {}

/** @category Interface */
export interface WorkbookProps extends WorkbookArgs {
  slug: string
  templateId: string
  variables: Record<string, any>
}

/** @category Interface */
export interface ApplicationInsightsProps extends ComponentArgs {
  billingFeatures?: ComponentCurrentBillingFeatureProps
}

/** @category Interface */
export interface WorkbookRenderer {
  renderToFile(filename: string, templateId: string, variables: Record<string, any>): string
}
