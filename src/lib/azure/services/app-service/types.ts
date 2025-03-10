import { ServicePlanConfig } from '@cdktf/provider-azurerm/lib/service-plan'
import { LinuxWebAppConfig } from '@cdktf/provider-azurerm/lib/linux-web-app'

export interface ServicePlanProps extends ServicePlanConfig {}

export interface LinuxWebAppProps extends LinuxWebAppConfig {}
