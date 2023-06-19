import {
  CfnApplicationProps,
  CfnConfigurationProfileProps,
  CfnDeploymentProps,
  CfnDeploymentStrategyProps,
  CfnEnvironmentProps,
} from 'aws-cdk-lib/aws-appconfig'

/**
 * @category cdk-utils.app-config-manager
 * @subcategory Properties
 */
export interface AppConfigProps {
  id: string
  application: CfnApplicationProps
  configurationProfile: CfnConfigurationProfileProps
  deployment: CfnDeploymentProps
  deploymentStrategy: CfnDeploymentStrategyProps
  environment: CfnEnvironmentProps
}
