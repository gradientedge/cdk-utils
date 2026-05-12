import {
  ComponentArgs,
  ComponentCurrentBillingFeatureArgs,
  WorkbookArgs,
} from '@pulumi/azure-native/applicationinsights/index.js'

/**
 * Properties for configuring Application Insights billing features
 * @see [Pulumi Azure Native Application Insights Billing Feature]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/insights/componentcurrentbillingfeature/}
 * @category Interface
 */
export interface ComponentCurrentBillingFeatureProps extends ComponentCurrentBillingFeatureArgs {}

/**
 * Properties for creating an Application Insights workbook
 * @see [Pulumi Azure Native Application Insights Workbook]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/applicationinsights/workbook/}
 * @category Interface
 */
export interface WorkbookProps extends WorkbookArgs {
  /** Short slug identifier used as the workbook output filename */
  slug: string
  /** Template identifier used to locate the YAML workbook template */
  templateId: string
  /** Variables to substitute into the workbook template */
  variables: Record<string, any>
}

/**
 * Properties for creating an Application Insights component
 * @see [Pulumi Azure Native Application Insights Component]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/insights/component/}
 * @category Interface
 */
export interface ApplicationInsightsProps extends ComponentArgs {
  /** Optional billing feature configuration for the component */
  billingFeatures?: ComponentCurrentBillingFeatureProps
}

/**
 * Interface for rendering workbook templates to files
 * @category Interface
 */
export interface WorkbookRenderer {
  /**
   * Render a workbook template to a file
   * @param filename the output filename slug
   * @param templateId the template identifier to locate
   * @param variables the variables to substitute into the template
   * @returns the absolute path to the rendered output file
   */
  renderToFile(filename: string, templateId: string, variables: Record<string, any>): string
}
