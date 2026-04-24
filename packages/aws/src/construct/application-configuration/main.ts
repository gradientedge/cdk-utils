import { Duration, Fn } from 'aws-cdk-lib'
import {
  CfnApplication,
  CfnConfigurationProfile,
  CfnDeployment,
  CfnEnvironment,
  CfnHostedConfigurationVersion,
  DeploymentStrategy,
  IDeploymentStrategy,
  RolloutStrategy,
} from 'aws-cdk-lib/aws-appconfig'
import { Construct } from 'constructs'

import { CommonConstruct } from '../../common/index.js'

import { ApplicationConfigurationProps } from './types.js'

/** @category Construct */
export class ApplicationConfiguration extends CommonConstruct {
  declare props: ApplicationConfigurationProps
  id: string
  appConfigApplication: CfnApplication
  appConfigEnvironment: CfnEnvironment
  appConfigProfile: CfnConfigurationProfile
  appConfigVersion: CfnHostedConfigurationVersion
  appConfigDeploymentStrategy: IDeploymentStrategy

  constructor(parent: Construct, id: string, props: ApplicationConfigurationProps) {
    super(parent, id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.createConfiguration()
    this.resolveEnvironmentVariables()
  }

  /**
   * @summary Create all AppConfig resources for the application configuration
   */
  protected createConfiguration() {
    this.createAppConfigApplication()
    this.createAppConfigEnvironment()
    this.createAppConfigProfile()
    this.createAppConfigVersion()
    this.createAppConfigDeploymentStrategy()
    this.createAppConfigDeployment()
  }

  /**
   * @summary Create the AppConfig application resource
   */
  protected createAppConfigApplication() {
    this.appConfigApplication = this.appConfigManager.createApplication(
      `${this.id}-ac-application`,
      this,
      this.props.appConfig
    )
  }

  /**
   * @summary Create the AppConfig environment resource
   */
  protected createAppConfigEnvironment() {
    this.appConfigEnvironment = this.appConfigManager.createEnvironment(
      `${this.id}-ac-environment`,
      this,
      Fn.ref(this.appConfigApplication.logicalId),
      this.props.appConfig
    )
  }

  /**
   * @summary Create the AppConfig configuration profile resource
   */
  protected createAppConfigProfile() {
    this.appConfigProfile = this.appConfigManager.createConfigurationProfile(
      `${this.id}-ac-profile`,
      this,
      Fn.ref(this.appConfigApplication.logicalId),
      this.props.appConfig
    )
  }

  /**
   * @summary Create the AppConfig hosted configuration version with the provided content
   */
  protected createAppConfigVersion() {
    this.appConfigVersion = new CfnHostedConfigurationVersion(this, `${this.id}-ac-configuration`, {
      applicationId: Fn.ref(this.appConfigApplication.logicalId),
      configurationProfileId: Fn.ref(this.appConfigProfile.logicalId),
      content: JSON.stringify(this.props.appConfigContent),
      contentType: 'application/json',
    })
  }

  /**
   * @summary Create or resolve the AppConfig deployment strategy
   */
  protected createAppConfigDeploymentStrategy() {
    if (!this.props.appConfig.deploymentStrategy) return

    if (this.props.appConfig.deploymentStrategy?.deploymentStrategyArn) {
      this.appConfigDeploymentStrategy = DeploymentStrategy.fromDeploymentStrategyArn(
        this,
        `${this.id}-ac-deployment-strategy`,
        this.props.appConfig.deploymentStrategy?.deploymentStrategyArn
      )
      return
    }

    this.appConfigDeploymentStrategy = new DeploymentStrategy(this, `${this.id}-ac-deployment-strategy`, {
      ...this.props.appConfig.deploymentStrategy,
      rolloutStrategy:
        this.props.appConfig.deploymentStrategy?.rolloutStrategy ??
        RolloutStrategy.linear({
          growthFactor: 100,
          deploymentDuration: Duration.minutes(0),
          finalBakeTime: Duration.minutes(0),
        }),
      deploymentStrategyName: this.resourceNameFormatter.format(
        this.props.appConfig.deploymentStrategy.deploymentStrategyName ?? 'common-deployment-strategy',
        this.props.resourceNameOptions?.appconfig
      ),
    })
  }

  /**
   * @summary Create the AppConfig deployment to roll out the configuration
   */
  protected createAppConfigDeployment() {
    new CfnDeployment(this, `${this.id}-app-config-deployment`, {
      applicationId: Fn.ref(this.appConfigApplication.logicalId),
      configurationProfileId: Fn.ref(this.appConfigProfile.logicalId),
      configurationVersion: Fn.ref(this.appConfigVersion.logicalId),
      deploymentStrategyId: this.appConfigDeploymentStrategy.deploymentStrategyId,
      environmentId: Fn.ref(this.appConfigEnvironment.logicalId),
    })
  }

  /**
   * @summary Resolve environment variables containing AppConfig resource identifiers for Lambda consumption
   */
  public resolveEnvironmentVariables(): any {
    return {
      APP_CONFIG_APPLICATION_ID: Fn.ref(this.appConfigApplication.logicalId),
      APP_CONFIG_CONFIGURATION_PROFILE_ID: Fn.ref(this.appConfigProfile.logicalId),
      APP_CONFIG_ENVIRONMENT_ID: Fn.ref(this.appConfigEnvironment.logicalId),
    }
  }
}
