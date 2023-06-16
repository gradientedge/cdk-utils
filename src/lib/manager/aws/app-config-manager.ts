import * as cdk from 'aws-cdk-lib'
import * as appconfig from 'aws-cdk-lib/aws-appconfig'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'
import { Architecture } from './constants'

/**
 * @stability stable
 * @category cdk-utils.app-config-manager
 * @subcategory Construct
 * @returns { Map<string, string> } AppConfig extension ARN by region for x84
 */
const ArnsByRegionForX86_64: { [region: string]: string } = {
  'us-east-1': 'arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension:110',
  'us-east-2': 'arn:aws:lambda:us-east-2:728743619870:layer:AWS-AppConfig-Extension:79',
  'us-west-1': 'arn:aws:lambda:us-west-1:958113053741:layer:AWS-AppConfig-Extension:121',
  'us-west-2': 'arn:aws:lambda:us-west-2:359756378197:layer:AWS-AppConfig-Extension:143',
  'ca-central-1': 'arn:aws:lambda:ca-central-1:039592058896:layer:AWS-AppConfig-Extension:79',
  'eu-central-1': 'arn:aws:lambda:eu-central-1:066940009817:layer:AWS-AppConfig-Extension:91',
  'eu-central-2': 'arn:aws:lambda:eu-central-2:758369105281:layer:AWS-AppConfig-Extension:29',
  'eu-west-1': 'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension:108',
  'eu-west-2': 'arn:aws:lambda:eu-west-2:282860088358:layer:AWS-AppConfig-Extension:79',
  'eu-west-3': 'arn:aws:lambda:eu-west-3:493207061005:layer:AWS-AppConfig-Extension:80',
  'eu-north-1': 'arn:aws:lambda:eu-north-1:646970417810:layer:AWS-AppConfig-Extension:139',
  'eu-south-1': 'arn:aws:lambda:eu-south-1:203683718741:layer:AWS-AppConfig-Extension:71',
  'eu-south-2': 'arn:aws:lambda:eu-south-2:586093569114:layer:AWS-AppConfig-Extension:26',
  'cn-north-1': 'arn:aws-cn:lambda:cn-north-1:615057806174:layer:AWS-AppConfig-Extension:66',
  'cn-northwest-1': 'arn:aws-cn:lambda:cn-northwest-1:615084187847:layer:AWS-AppConfig-Extension:66',
  'ap-east-1': 'arn:aws:lambda:ap-east-1:630222743974:layer:AWS-AppConfig-Extension:71',
  'ap-northeast-1': 'arn:aws:lambda:ap-northeast-1:980059726660:layer:AWS-AppConfig-Extension:82',
  'ap-northeast-2': 'arn:aws:lambda:ap-northeast-2:826293736237:layer:AWS-AppConfig-Extension:91',
  'ap-northeast-3': 'arn:aws:lambda:ap-northeast-3:706869817123:layer:AWS-AppConfig-Extension:84',
  'ap-southeast-1': 'arn:aws:lambda:ap-southeast-1:421114256042:layer:AWS-AppConfig-Extension:89',
  'ap-southeast-2': 'arn:aws:lambda:ap-southeast-2:080788657173:layer:AWS-AppConfig-Extension:91',
  'ap-southeast-3': 'arn:aws:lambda:ap-southeast-3:418787028745:layer:AWS-AppConfig-Extension:60',
  'ap-southeast-4': 'arn:aws:lambda:ap-southeast-4:307021474294:layer:AWS-AppConfig-Extension:2',
  'ap-south-1': 'arn:aws:lambda:ap-south-1:554480029851:layer:AWS-AppConfig-Extension:92',
  'ap-south-2': 'arn:aws:lambda:ap-south-2:489524808438:layer:AWS-AppConfig-Extension:29',
  'sa-east-1': 'arn:aws:lambda:sa-east-1:000010852771:layer:AWS-AppConfig-Extension:110',
  'af-south-1': 'arn:aws:lambda:af-south-1:574348263942:layer:AWS-AppConfig-Extension:71',
  'me-central-1': 'arn:aws:lambda:me-central-1:662846165436:layer:AWS-AppConfig-Extension:31',
  'me-south-1': 'arn:aws:lambda:me-south-1:559955524753:layer:AWS-AppConfig-Extension:71',
  'us-gov-east-1': 'arn:aws-us-gov:lambda:us-gov-east-1:946561847325:layer:AWS-AppConfig-Extension:44',
  'us-gov-west-1': 'arn:aws-us-gov:lambda:us-gov-west-1:946746059096:layer:AWS-AppConfig-Extension:44',
}

/**
 * @stability stable
 * @category cdk-utils.app-config-manager
 * @subcategory Construct
 * @returns { Map<string, string> } AppConfig extension ARN by region for x84
 */
const ArnsByRegionForArm: { [region: string]: string } = {
  'us-east-1': 'arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension-Arm64:43',
  'us-east-2': 'arn:aws:lambda:us-east-2:728743619870:layer:AWS-AppConfig-Extension-Arm64:31',
  'us-west-2': 'arn:aws:lambda:us-west-2:359756378197:layer:AWS-AppConfig-Extension-Arm64:45',
  'eu-central-1': 'arn:aws:lambda:eu-central-1:066940009817:layer:AWS-AppConfig-Extension-Arm64:34',
  'eu-west-1': 'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension-Arm64:46',
  'eu-west-2': 'arn:aws:lambda:eu-west-2:282860088358:layer:AWS-AppConfig-Extension-Arm64:31',
  'ap-northeast-1': 'arn:aws:lambda:ap-northeast-1:980059726660:layer:AWS-AppConfig-Extension-Arm64:35',
  'ap-southeast-1': 'arn:aws:lambda:ap-southeast-1:421114256042:layer:AWS-AppConfig-Extension-Arm64:41',
  'ap-southeast-2': 'arn:aws:lambda:ap-southeast-2:080788657173:layer:AWS-AppConfig-Extension-Arm64:34',
  'ap-south-1': 'arn:aws:lambda:ap-south-1:554480029851:layer:AWS-AppConfig-Extension-Arm64:34',
}

/**
 * @category cdk-utils.app-config-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS AppConfig.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.appConfigManager.createApplication('MyApplication', this)
 *   }
 * }
 *
 * @see [CDK AppConfig Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_appconfig-readme.html}
 */
export class AppConfigManager {
  /**
   * Method to get static ARNs for AppConfig extensions
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {Architecture} type type of the architecture
   */
  public getArnForAppConfigExtension(scope: common.CommonConstruct, type: Architecture) {
    switch (type) {
      case Architecture.ARM_64:
        return ArnsByRegionForArm[scope.props.region]
      case Architecture.X86_64:
        return ArnsByRegionForX86_64[scope.props.region]
      default:
        throw `Invalid type ${type} specified`
    }
  }

  /**
   * @summary Method to create an AppConfig Application
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.AppConfigProps} props
   * @returns {appconfig.CfnApplication}
   */
  public createApplication(
    id: string,
    scope: common.CommonConstruct,
    props: types.AppConfigProps
  ): appconfig.CfnApplication {
    if (!props) throw `AppConfig props undefined for ${id}`

    const application = new appconfig.CfnApplication(scope, `${id}`, {
      name: `${props.application.name}-${scope.props.stage}`,
      description: props.application.description,
      tags: props.application.tags,
    })

    utils.createCfnOutput(`${id}-ApplicationId`, scope, cdk.Fn.ref(application.logicalId))
    utils.createCfnOutput(`${id}-ApplicationName`, scope, application.name)

    return application
  }

  /**
   * @summary Method to create an AppConfig Environment for a given application
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {string} applicationId id of the application
   * @param {types.AppConfigProps} props
   * @returns {appconfig.CfnEnvironment}
   */
  public createEnvironment(
    id: string,
    scope: common.CommonConstruct,
    applicationId: string,
    props: types.AppConfigProps
  ): appconfig.CfnEnvironment {
    if (!props) throw `AppConfig props undefined for ${id}`

    const environment = new appconfig.CfnEnvironment(scope, `${id}`, {
      applicationId: applicationId,
      name: props.environment.name ?? scope.props.stage,
      description: props.environment.description,
      monitors: props.environment.monitors,
      tags: props.environment.tags,
    })

    utils.createCfnOutput(`${id}-configurationEnvironmentId`, scope, cdk.Fn.ref(environment.logicalId))
    utils.createCfnOutput(`${id}-configurationEnvironmentName`, scope, environment.name)

    return environment
  }

  /**
   * @summary Method to create an AppConfig Configuration Profile for a given application
   * - <p>&#9888; The <b>locationUri</b> is defaulted to <i>hosted</i> if undefined</p>
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {string} applicationId id of the application
   * @param {types.AppConfigProps} props
   * @returns {appconfig.CfnConfigurationProfile}
   */
  public createConfigurationProfile(
    id: string,
    scope: common.CommonConstruct,
    applicationId: string,
    props: types.AppConfigProps
  ): appconfig.CfnConfigurationProfile {
    if (!props) throw `AppConfig props undefined for ${id}`

    const profile = new appconfig.CfnConfigurationProfile(scope, `${id}`, {
      applicationId: applicationId,
      locationUri: props.configurationProfile.locationUri || 'hosted',
      name: `${props.configurationProfile.name}-${scope.props.stage}`,
      description: props.configurationProfile.description,
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
