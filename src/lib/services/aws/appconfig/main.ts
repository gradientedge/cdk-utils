import * as cdk from 'aws-cdk-lib'
import * as appconfig from 'aws-cdk-lib/aws-appconfig'
import * as utils from '../../../utils'
import { Architecture } from '../constants'
import { AppConfigProps } from './types'
import { ArnsByRegionForArm64, ArnsByRegionForX86_64 } from './constants'
import { CommonConstruct } from '../../../common'

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
  public createApplication(id: string, scope: CommonConstruct, props: AppConfigProps): appconfig.CfnApplication {
    if (!props) throw `AppConfig props undefined for ${id}`

    const application = new appconfig.CfnApplication(scope, `${id}`, {
      description: props.application.description,
      name: `${props.application.name}-${scope.props.stage}`,
      tags: props.application.tags,
    })

    utils.createCfnOutput(`${id}-ApplicationId`, scope, cdk.Fn.ref(application.logicalId))
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
  ): appconfig.CfnEnvironment {
    if (!props) throw `AppConfig props undefined for ${id}`

    const environment = new appconfig.CfnEnvironment(scope, `${id}`, {
      applicationId: applicationId,
      description: props.environment.description,
      monitors: props.environment.monitors,
      name: props.environment.name ?? scope.props.stage,
      tags: props.environment.tags,
    })

    utils.createCfnOutput(`${id}-configurationEnvironmentId`, scope, cdk.Fn.ref(environment.logicalId))
    utils.createCfnOutput(`${id}-configurationEnvironmentName`, scope, environment.name)

    return environment
  }

  /**
   * @summary Method to create an AppConfig Configuration Profile for a given application
   * - <p>&#9888; The <b>locationUri</b> is defaulted to <i>hosted</i> if undefined</p>
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param applicationId id of the application
   * @param props
   * @returns the appconfig configuration profile
   */
  public createConfigurationProfile(
    id: string,
    scope: CommonConstruct,
    applicationId: string,
    props: AppConfigProps
  ): appconfig.CfnConfigurationProfile {
    if (!props) throw `AppConfig props undefined for ${id}`

    const profile = new appconfig.CfnConfigurationProfile(scope, `${id}`, {
      applicationId: applicationId,
      description: props.configurationProfile.description,
      locationUri: props.configurationProfile.locationUri || 'hosted',
      name: `${props.configurationProfile.name}-${scope.props.stage}`,
      retrievalRoleArn: props.configurationProfile.retrievalRoleArn,
      tags: props.configurationProfile.tags,
      type: props.configurationProfile.type,
      validators: props.configurationProfile.validators,
    })

    utils.createCfnOutput(`${id}-configurationProfileId`, scope, cdk.Fn.ref(profile.logicalId))
    utils.createCfnOutput(`${id}-configurationProfileName`, scope, profile.name)

    return profile
  }
}
