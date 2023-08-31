import {
  ApplicationProps,
  DeploymentStrategyProps,
  EnvironmentProps,
  ExtensionProps,
  HostedConfigurationProps,
  SourcedConfigurationProps,
} from '@aws-cdk/aws-appconfig-alpha'
import { CfnConfigurationProfileProps, CfnDeploymentProps } from 'aws-cdk-lib/aws-appconfig'

/**
 */
export interface AppConfigProps {
  id: string
  application: ApplicationProps
  deployment: CfnDeploymentProps
  deploymentStrategy: DeploymentStrategyProps
  environment: EnvironmentProps
  extension: ExtensionProps
  hostedConfiguration: HostedConfigurationProps
  sourcedConfiguration: SourcedConfigurationProps
}
