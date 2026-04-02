import { AppServicePlanArgs, WebAppArgs } from '@pulumi/azure-native/web/index.js'

export interface ServicePlanProps extends AppServicePlanArgs {}

export interface LinuxWebAppProps extends WebAppArgs {}
