import { ComponentArgs, ComponentCurrentBillingFeatureArgs } from '@pulumi/azure-native/applicationinsights/index.js'

/** @category Interface */
export interface ComponentCurrentBillingFeatureProps extends ComponentCurrentBillingFeatureArgs {}

/** @category Interface */
export interface ApplicationInsightsProps extends ComponentArgs {
  billingFeatures?: ComponentCurrentBillingFeatureProps
}
