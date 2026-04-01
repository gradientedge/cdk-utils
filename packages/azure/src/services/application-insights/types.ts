import { ComponentArgs, ComponentCurrentBillingFeatureArgs } from '@pulumi/azure-native/applicationinsights/index.js'

export interface ComponentCurrentBillingFeatureProps extends ComponentCurrentBillingFeatureArgs {}

export interface ApplicationInsightsProps extends ComponentArgs {
  billingFeatures?: ComponentCurrentBillingFeatureProps
}
