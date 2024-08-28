import { Fn } from 'aws-cdk-lib'
import { CfnApplication, CfnConfigurationProfile, CfnEnvironment } from 'aws-cdk-lib/aws-appconfig'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import { Architecture } from '../constants'
import { ArnsByRegionForArm64, ArnsByRegionForX86_64 } from './constants'
import { AppConfigProps } from './types'

/**
 * @classdesc Provides operations on AWS
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
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
  public createApplication(id: string, scope: CommonConstruct, props: AppConfigProps): CfnApplication {
    if (!props) throw `AppConfig props undefined for ${id}`

    const application = new CfnApplication(scope, `${id}`, {
      ...props.application,
      name: scope.resourceNameFormatter.format(props.application.name, props.resourceNameOptions),
    })

    createCfnOutput(`${id}-ApplicationId`, scope, Fn.ref(application.logicalId))
    createCfnOutput(`${id}-ApplicationName`, scope, application.name)

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
  ): CfnEnvironment {
    if (!props) throw `AppConfig props undefined for ${id}`

    const environment = new CfnEnvironment(scope, `${id}`, {
      ...props.environment,
      applicationId,
      name: props.environment.name ?? scope.props.stage,
    })

    createCfnOutput(`${id}-configurationEnvironmentId`, scope, Fn.ref(environment.logicalId))
    createCfnOutput(`${id}-configurationEnvironmentName`, scope, environment.name)

    return environment
  }

  /**
   * @summary Method to create an AppConfig Configuration Profile for a given application
   * - The <b>locationUri</b> is defaulted to <i>hosted</i> if undefined</p>
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
  ): CfnConfigurationProfile {
    if (!props) throw `AppConfig props undefined for ${id}`

    const profile = new CfnConfigurationProfile(scope, `${id}`, {
      ...props.configurationProfile,
      applicationId,
      locationUri: props.configurationProfile.locationUri || 'hosted',
      name: scope.resourceNameFormatter.format(props.configurationProfile.name, props.resourceNameOptions),
    })

    createCfnOutput(`${id}-configurationProfileId`, scope, Fn.ref(profile.logicalId))
    createCfnOutput(`${id}-configurationProfileName`, scope, profile.name)

    return profile
  }
}
