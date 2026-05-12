import { AppServicePlanArgs, WebAppArgs } from '@pulumi/azure-native/web/index.js'

/**
 * Properties for creating an Azure App Service Plan
 * @see [Pulumi Azure Native App Service Plan]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/appserviceplan/}
 * @category Interface
 */
export interface ServicePlanProps extends AppServicePlanArgs {}

/**
 * Properties for creating an Azure Linux Web App
 * @see [Pulumi Azure Native Web App]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webapp/}
 * @category Interface
 */
export interface LinuxWebAppProps extends WebAppArgs {}
