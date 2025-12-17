import { ServicePlanConfig } from '@cdktf/provider-azurerm/lib/service-plan/index.js'
import { LinuxWebAppConfig } from '@cdktf/provider-azurerm/lib/linux-web-app/index.js'

export interface ServicePlanProps extends ServicePlanConfig {}

export interface LinuxWebAppProps extends LinuxWebAppConfig {}
