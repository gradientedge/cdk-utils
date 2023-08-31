import {
  Application,
  DeploymentStrategy,
  Environment,
  Extension,
  HostedConfiguration,
  RolloutStrategy,
  SourcedConfiguration,
} from '@aws-cdk/aws-appconfig-alpha'
import { CfnDeployment } from 'aws-cdk-lib/aws-appconfig'
import { CommonConstruct } from '../../../common'
import * as utils from '../../../utils'
import { Architecture } from '../constants'
import { ArnsByRegionForArm64, ArnsByRegionForX86_64 } from './constants'
import { AppConfigProps } from './types'
import { Fn } from 'aws-cdk-lib'

/**
 * @classdesc Provides operations on AWS AppConfig.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.appConfigManager.createApplication('MyApplication', this)
 *   }
 * }
 * @see [CDK AppConfig Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_appconfig-readme.html}
 */
export class AppConfigManager {
  /**
   * Method to get static ARNs for AppConfig extensions
   * @param scope scope in which this resource is defined
   * @param type type of the architecture
   */
  public getArnForAppConfigExtension(scope: CommonConstruct, type: Architecture) {
    switch (type) {
      case Architecture.ARM_64:
        return ArnsByRegionForArm64[scope.props.region]
      case Architecture.X86_64:
        return ArnsByRegionForX86_64[scope.props.region]
      default:
        throw `Invalid type ${type} specified`
    }
  }

  /**
   * @summary Method to create an AppConfig Application
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @returns the appconfig application
   */
  public createApplication(id: string, scope: CommonConstruct, props: AppConfigProps): Application {
    if (!props) throw `AppConfig props undefined for ${id}`

    const application = new Application(scope, `${id}`, {
      description: props.application.description,
      name: `${props.application.name}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}-ApplicationId`, scope, application.applicationId)
    utils.createCfnOutput(`${id}-ApplicationArn`, scope, application.applicationArn)
    utils.createCfnOutput(`${id}-ApplicationName`, scope, application.name)

    return application
  }

  /**
   * @summary Method to create an AppConfig Environment for a given application
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param applicationId id of the application
   * @param props
   * @returns the appconfig environment
   */
  public createEnvironment(
    id: string,
    scope: CommonConstruct,
    applicationId: string,
    props: AppConfigProps
  ): Environment {
    if (!props) throw `AppConfig props undefined for ${id}`

    const environment = new Environment(scope, `${id}`, {
      application: Application.fromApplicationId(scope, `${id}-app`, applicationId),
      description: props.environment.description,
      monitors: props.environment.monitors,
      name: props.environment.name ?? scope.props.stage,
    })

    utils.createCfnOutput(`${id}-configurationEnvironmentId`, scope, environment.environmentId)
    utils.createCfnOutput(`${id}-configurationEnvironmentArn`, scope, environment.environmentArn)
    utils.createCfnOutput(`${id}-configurationEnvironmentName`, scope, environment.name)

    return environment
  }

  /**
   * @summary Method to create an AppConfig Hosted Configuration for a given application
   * - <p>&#9888; The <b>locationUri</b> is defaulted to <i>hosted</i> if undefined</p>
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param applicationId id of the application
   * @param props
   * @returns the appconfig configuration profile
   */
  public createHostedConfiguration(
    id: string,
    scope: CommonConstruct,
    applicationId: string,
    props: AppConfigProps
  ): HostedConfiguration {
    if (!props) throw `AppConfig props undefined for ${id}`

    const profile = new HostedConfiguration(scope, `${id}`, {
      application: Application.fromApplicationId(scope, `${id}-app`, applicationId),
      content: props.hostedConfiguration.content,
      deployTo: props.hostedConfiguration.deployTo,
      deploymentKey: props.hostedConfiguration.deploymentKey,
      deploymentStrategy: props.hostedConfiguration.deploymentStrategy,
      description: props.hostedConfiguration.description,
      name: `${props.hostedConfiguration.name}-${scope.props.stage}`,
      type: props.hostedConfiguration.type,
      validators: props.hostedConfiguration.validators,
    })

    utils.createCfnOutput(`${id}-configurationProfileId`, scope, profile.configurationProfileId)
    utils.createCfnOutput(`${id}-configurationProfileArn`, scope, profile.configurationProfileArn)
    utils.createCfnOutput(`${id}-configurationProfileName`, scope, profile.name)

    return profile
  }

  /**
   * @summary Method to create an AppConfig Sourced Configuration for a given application
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param applicationId id of the application
   * @param props
   * @returns the appconfig configuration profile
   */
  public createSourcedConfiguration(
    id: string,
    scope: CommonConstruct,
    applicationId: string,
    props: AppConfigProps
  ): SourcedConfiguration {
    if (!props) throw `AppConfig props undefined for ${id}`

    const profile = new SourcedConfiguration(scope, `${id}`, {
      application: Application.fromApplicationId(scope, `${id}-app`, applicationId),
      deployTo: props.sourcedConfiguration.deployTo,
      deploymentKey: props.sourcedConfiguration.deploymentKey,
      deploymentStrategy: props.sourcedConfiguration.deploymentStrategy,
      description: props.sourcedConfiguration.description,
      location: props.sourcedConfiguration.location,
      name: `${props.sourcedConfiguration.name}-${scope.props.stage}`,
      retrievalRole: props.sourcedConfiguration.retrievalRole,
      type: props.sourcedConfiguration.type,
      validators: props.sourcedConfiguration.validators,
      versionNumber: props.sourcedConfiguration.versionNumber,
    })

    utils.createCfnOutput(`${id}-configurationProfileId`, scope, profile.configurationProfileId)
    utils.createCfnOutput(`${id}-configurationProfileArn`, scope, profile.configurationProfileArn)
    utils.createCfnOutput(`${id}-configurationProfileName`, scope, profile.name)

    return profile
  }

  /**
   * @summary Method to create an AppConfig Deployment Strategy
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @returns the appconfig deployment strategy
   */
  public createDeploymentStrategy(id: string, scope: CommonConstruct, props: AppConfigProps): DeploymentStrategy {
    if (!props) throw `AppConfig props undefined for ${id}`

    const deploymentStrategy = new DeploymentStrategy(scope, `${id}`, {
      description: props.deploymentStrategy.description,
      name: `${props.deploymentStrategy.name}-${scope.props.stage}`,
      rolloutStrategy: props.deploymentStrategy.rolloutStrategy,
    })

    utils.createCfnOutput(`${id}-deploymentStrategyId`, scope, deploymentStrategy.deploymentStrategyId)
    utils.createCfnOutput(`${id}-deploymentStrategyArn`, scope, deploymentStrategy.deploymentStrategyArn)
    utils.createCfnOutput(`${id}-deploymentStrategyName`, scope, deploymentStrategy.name)

    return deploymentStrategy
  }

  /**
   * @summary Method to create an AppConfig Deployment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param applicationId the application id
   * @param configurationProfileId the configuration profile id
   * @param configurationVersion the configuration version
   * @param deploymentStrategyId the deployment strategy id
   * @param environmentId the environment id
   * @returns the appconfig deployment
   */
  public createDeployment(
    id: string,
    scope: CommonConstruct,
    applicationId: string,
    configurationProfileId: string,
    configurationVersion: string,
    deploymentStrategyId: string,
    environmentId: string
  ): CfnDeployment {
    const deployment = new CfnDeployment(scope, `${id}`, {
      applicationId: applicationId,
      configurationProfileId: configurationProfileId,
      configurationVersion: configurationVersion,
      deploymentStrategyId: deploymentStrategyId,
      environmentId: environmentId,
    })

    utils.createCfnOutput(`${id}-deploymentLogicalId`, scope, Fn.ref(deployment.logicalId))

    return deployment
  }

  /**
   * @summary Method to create an AppConfig Extension
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @returns the appconfig extension
   */
  public createExtension(id: string, scope: CommonConstruct, props: AppConfigProps) {
    if (!props) throw `AppConfig props undefined for ${id}`

    const extension = new Extension(scope, `${id}`, {
      actions: props.extension.actions,
      description: props.extension.description,
      latestVersionNumber: props.extension.latestVersionNumber,
      name: `${props.extension.name}-${scope.props.stage}`,
      parameters: props.extension.parameters,
    })

    utils.createCfnOutput(`${id}-extensionId`, scope, extension.extensionId)
    utils.createCfnOutput(`${id}-extensionArn`, scope, extension.extensionArn)
    utils.createCfnOutput(`${id}-extensionName`, scope, extension.name)

    return extension
  }
}
