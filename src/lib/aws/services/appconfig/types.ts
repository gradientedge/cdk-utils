import {
  CfnApplicationProps,
  CfnConfigurationProfileProps,
  CfnDeploymentProps,
  CfnDeploymentStrategyProps,
  CfnEnvironmentProps,
} from 'aws-cdk-lib/aws-appconfig'

/**
 */
export interface AppConfigProps {
  application: CfnApplicationProps
  configurationProfile: CfnConfigurationProfileProps
  deployment: CfnDeploymentProps
  deploymentStrategy: CfnDeploymentStrategyProps
  environment: CfnEnvironmentProps
  id: string
}
