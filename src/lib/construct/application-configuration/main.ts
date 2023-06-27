import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as appconfig from 'aws-cdk-lib/aws-appconfig'
import { ApplicationConfigurationProps } from './types'
import { CommonConstruct } from '../../common'

export class ApplicationConfiguration extends CommonConstruct {
  declare props: ApplicationConfigurationProps
  id: string
  appConfigApplication: appconfig.CfnApplication
  appConfigEnvironment: appconfig.CfnEnvironment
  appConfigProfile: appconfig.CfnConfigurationProfile
  appConfigVersion: appconfig.CfnHostedConfigurationVersion
  appConfigDeploymentStrategy: appconfig.CfnDeploymentStrategy

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
    this.createAppConfigProfile()
    this.createAppConfigVersion()
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
      cdk.Fn.ref(this.appConfigApplication.logicalId),
      this.props.appConfig
    )
  }

  protected createAppConfigProfile() {
    this.appConfigProfile = this.appConfigManager.createConfigurationProfile(
      `${this.id}-ac-profile`,
      this,
      cdk.Fn.ref(this.appConfigApplication.logicalId),
      this.props.appConfig
    )
  }

  protected createAppConfigVersion() {
    this.appConfigVersion = new appconfig.CfnHostedConfigurationVersion(this, `${this.id}-ac-configuration`, {
      applicationId: cdk.Fn.ref(this.appConfigApplication.logicalId),
      configurationProfileId: cdk.Fn.ref(this.appConfigProfile.logicalId),
      content: JSON.stringify(this.props.appConfigContent),
      contentType: 'application/json',
    })
  }

  protected createAppConfigDeploymentStrategy() {
    this.appConfigDeploymentStrategy = new appconfig.CfnDeploymentStrategy(this, `${this.id}-ac-deployment-strategy`, {
      deploymentDurationInMinutes: this.props.appConfig.deploymentStrategy.deploymentDurationInMinutes,
      growthFactor: this.props.appConfig.deploymentStrategy.growthFactor,
      name: this.props.appConfig.deploymentStrategy.name,
      replicateTo: this.props.appConfig.deploymentStrategy.replicateTo,
    })
  }

  protected createAppConfigDeployment() {
    new appconfig.CfnDeployment(this, `${this.id}-app-config-deployment`, {
      applicationId: cdk.Fn.ref(this.appConfigApplication.logicalId),
      configurationProfileId: cdk.Fn.ref(this.appConfigProfile.logicalId),
      configurationVersion: cdk.Fn.ref(this.appConfigVersion.logicalId),
      deploymentStrategyId: cdk.Fn.ref(this.appConfigDeploymentStrategy.logicalId),
      environmentId: cdk.Fn.ref(this.appConfigEnvironment.logicalId),
    })
  }

  public resolveEnvironmentVariables(): any {
    return {
      APP_CONFIG_APPLICATION_ID: cdk.Fn.ref(this.appConfigApplication.logicalId),
      APP_CONFIG_CONFIGURATION_PROFILE_ID: cdk.Fn.ref(this.appConfigProfile.logicalId),
      APP_CONFIG_ENVIRONMENT_ID: cdk.Fn.ref(this.appConfigEnvironment.logicalId),
    }
  }

  protected aaa(): void {}
}
