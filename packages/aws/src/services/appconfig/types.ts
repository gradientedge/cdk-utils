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
/** @category Interface */
export interface AppConfigDeploymentStrategyProps extends DeploymentStrategyProps {
  deploymentStrategyArn?: string
}

/**
 */
/** @category Interface */
export interface AppConfigProps {
  application: CfnApplicationProps
  configurationProfile: CfnConfigurationProfileProps
  deployment: CfnDeploymentProps
  deploymentStrategy: AppConfigDeploymentStrategyProps
  environment: CfnEnvironmentProps
  id: string
}
