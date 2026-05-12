import {
  CfnApplicationProps,
  CfnConfigurationProfileProps,
  CfnDeploymentProps,
  CfnEnvironmentProps,
  DeploymentStrategyProps,
} from 'aws-cdk-lib/aws-appconfig'

/**
 * Props for an AppConfig deployment strategy with an optional ARN reference.
 * @see {@link AppConfigManager.createDeploymentStrategy}
 */
/** @category Interface */
export interface AppConfigDeploymentStrategyProps extends DeploymentStrategyProps {
  /** The ARN of the deployment strategy */
  deploymentStrategyArn?: string
}

/**
 * Props for configuring an AppConfig application and its associated resources.
 * @see {@link AppConfigManager}
 */
/** @category Interface */
export interface AppConfigProps {
  /** Configuration for the AppConfig application */
  application: CfnApplicationProps
  /** Configuration for the AppConfig configuration profile */
  configurationProfile: CfnConfigurationProfileProps
  /** Configuration for the AppConfig deployment */
  deployment: CfnDeploymentProps
  /** Configuration for the AppConfig deployment strategy */
  deploymentStrategy: AppConfigDeploymentStrategyProps
  /** Configuration for the AppConfig environment */
  environment: CfnEnvironmentProps
  /** Unique identifier for the AppConfig resource set */
  id: string
}
