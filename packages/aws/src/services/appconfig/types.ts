import {
  CfnApplicationProps,
  CfnConfigurationProfileProps,
  CfnDeploymentProps,
  CfnEnvironmentProps,
  DeploymentStrategyProps,
} from 'aws-cdk-lib/aws-appconfig'

/**
 *
 */
export interface AppConfigDeploymentStrategyProps extends DeploymentStrategyProps {
  deploymentStrategyArn?: string
}

/**
 */
export interface AppConfigProps {
  application: CfnApplicationProps
  configurationProfile: CfnConfigurationProfileProps
  deployment: CfnDeploymentProps
  deploymentStrategy: AppConfigDeploymentStrategyProps
  environment: CfnEnvironmentProps
  id: string
}
