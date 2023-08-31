import {
  Application,
  DeploymentStrategy,
  Environment,
  HostedConfiguration,
  SourcedConfiguration,
} from '@aws-cdk/aws-appconfig-alpha'
import { CfnDeployment } from 'aws-cdk-lib/aws-appconfig'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { ApplicationConfigurationProps } from './types'

export class ApplicationConfiguration extends CommonConstruct {
  props: ApplicationConfigurationProps
  id: string
  appConfigApplication: Application
  appConfigEnvironment: Environment
  appConfigConfiguration: HostedConfiguration | SourcedConfiguration
  appConfigDeploymentStrategy: DeploymentStrategy
  appConfigDeployment: CfnDeployment

  constructor(parent: Construct, id: string, props: ApplicationConfigurationProps) {
    super(parent, id, props)
    this.props = props
    this.id = id
  }

  initResources() {
    this.createConfiguration()
    this.resolveEnvironmentVariables()
  }

  protected createConfiguration() {
    this.createAppConfigApplication()
    this.createAppConfigEnvironment()
    this.createAppConfigConfiguration()
    this.createAppConfigDeploymentStrategy()
    this.createAppConfigDeployment()
  }

  protected createAppConfigApplication() {
    this.appConfigApplication = this.appConfigManager.createApplication(
      `${this.id}-ac-application`,
      this,
      this.props.appConfig
    )
  }

  protected createAppConfigEnvironment() {
    this.appConfigEnvironment = this.appConfigManager.createEnvironment(
      `${this.id}-ac-environment`,
      this,
      this.appConfigApplication.applicationId,
      this.props.appConfig
    )
  }

  protected createAppConfigConfiguration() {
    if (this.props.appConfig.hostedConfiguration) {
      this.appConfigConfiguration = this.appConfigManager.createHostedConfiguration(
        `${this.id}-ac-profile`,
        this,
        this.appConfigApplication.applicationId,
        this.props.appConfig
      )
      return
    }

    if (this.props.appConfig.sourcedConfiguration) {
      this.appConfigConfiguration = this.appConfigManager.createSourcedConfiguration(
        `${this.id}-ac-profile`,
        this,
        this.appConfigApplication.applicationId,
        this.props.appConfig
      )
      return
    }
  }

  protected createAppConfigDeploymentStrategy() {
    this.appConfigDeploymentStrategy = this.appConfigManager.createDeploymentStrategy(
      `${this.id}-ac-deployment-strategy`,
      this,
      this.props.appConfig
    )
  }

  protected createAppConfigDeployment() {
    if (!this.appConfigConfiguration.versionNumber) return
    this.appConfigDeployment = this.appConfigManager.createDeployment(
      `${this.id}-ac-deployment`,
      this,
      this.appConfigApplication.applicationId,
      this.appConfigConfiguration.configurationProfileId,
      this.appConfigConfiguration.versionNumber,
      this.appConfigDeploymentStrategy.deploymentStrategyId,
      this.appConfigEnvironment.environmentId
    )
  }

  public resolveEnvironmentVariables(): any {
    return {
      APP_CONFIG_APPLICATION_ID: this.appConfigApplication.applicationId,
      APP_CONFIG_CONFIGURATION_PROFILE_ID: this.appConfigConfiguration.configurationProfileId,
      APP_CONFIG_ENVIRONMENT_ID: this.appConfigEnvironment.environmentId,
    }
  }
}
