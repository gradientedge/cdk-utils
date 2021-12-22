import * as appconfig from 'aws-cdk-lib/aws-appconfig'
import * as cdk from 'aws-cdk-lib'
import { CommonConstruct } from '../common/commonConstruct'
import { AppConfigProps } from '../types'
import { createCfnOutput } from '../utils'

/**
 * @stability stable
 * @category Utils
 * @returns { Map<string, string> } ArnsByRegion
 */
export const ArnsByRegion: { [key: string]: string } = {
  'us-east-1': 'arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension:11',
  'us-east-2': 'arn:aws:lambda:us-east-2:728743619870:layer:AWS-AppConfig-Extension:15',
  'us-west-1': 'arn:aws:lambda:us-west-1:958113053741:layer:AWS-AppConfig-Extension:11',
  'us-west-2': 'arn:aws:lambda:us-west-2:359756378197:layer:AWS-AppConfig-Extension:18',
  'ca-central-1': 'arn:aws:lambda:ca-central-1:039592058896:layer:AWS-AppConfig-Extension:15',
  'eu-central-1': 'arn:aws:lambda:eu-central-1:066940009817:layer:AWS-AppConfig-Extension:19',
  'eu-west-1': 'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension:11',
  'eu-west-2': 'arn:aws:lambda:eu-west-2:282860088358:layer:AWS-AppConfig-Extension:15',
  'eu-west-3': 'arn:aws:lambda:eu-west-3:493207061005:layer:AWS-AppConfig-Extension:15',
  'eu-north-1': 'arn:aws:lambda:eu-north-1:646970417810:layer:AWS-AppConfig-Extension:19',
  'ap-east-1': 'arn:aws:lambda:ap-east-1:630222743974:layer:AWS-AppConfig-Extension:15',
  'ap-northeast-1': 'arn:aws:lambda:ap-northeast-1:980059726660:layer:AWS-AppConfig-Extension:12',
  'ap-northeast-2': 'arn:aws:lambda:ap-northeast-2:826293736237:layer:AWS-AppConfig-Extension:19',
  'ap-northeast-3': 'arn:aws:lambda:ap-northeast-3:706869817123:layer:AWS-AppConfig-Extension:3',
  'ap-southeast-1': 'arn:aws:lambda:ap-southeast-1:421114256042:layer:AWS-AppConfig-Extension:12',
  'ap-southeast-2': 'arn:aws:lambda:ap-southeast-2:080788657173:layer:AWS-AppConfig-Extension:19',
  'ap-south-1': 'arn:aws:lambda:ap-south-1:554480029851:layer:AWS-AppConfig-Extension:20',
  'sa-east-1': 'arn:aws:lambda:sa-east-1:000010852771:layer:AWS-AppConfig-Extension:11',
  'af-south-1': 'arn:aws:lambda:af-south-1:574348263942:layer:AWS-AppConfig-Extension:15',
  'me-south-1': 'arn:aws:lambda:me-south-1:559955524753:layer:AWS-AppConfig-Extension:15',
}

/**
 * @category Management & Governance
 * @summary Provides operations on AWS AppConfig.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.appConfigManager.createApplication('MyApplication', this)
 * }
 *
 * @see [CDK AppConfig Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-appconfig-readme.html}
 */
export class AppConfigManager {
  /**
   * Method to get static ARNs for AppConfig extensions
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public getArnForAppConfigExtension(scope: CommonConstruct) {
    return ArnsByRegion[scope.props.region]
  }

  /**
   * @summary Method to create an AppConfig Application
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {AppConfigProps} props
   * @returns {appconfig.CfnApplication}
   */
  public createApplication(id: string, scope: CommonConstruct, props: AppConfigProps): appconfig.CfnApplication {
    if (!props) throw `AppConfig props undefined`

    const application = new appconfig.CfnApplication(scope, `${id}`, {
      name: `${props.application.name}-${scope.props.stage}`,
      description: props.application.description,
      tags: props.application.tags,
    })

    createCfnOutput(`${id}-ApplicationId`, scope, cdk.Fn.ref(application.logicalId))
    createCfnOutput(`${id}-ApplicationName`, scope, application.name)

    return application
  }

  /**
   * @summary Method to create an AppConfig Environment for a given application
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {string} applicationId id of the application
   * @param {AppConfigProps} props
   * @returns {appconfig.CfnEnvironment}
   */
  public createEnvironment(
    id: string,
    scope: CommonConstruct,
    applicationId: string,
    props: AppConfigProps
  ): appconfig.CfnEnvironment {
    if (!props) throw `AppConfig props undefined`

    const environment = new appconfig.CfnEnvironment(scope, `${id}`, {
      applicationId: applicationId,
      name: scope.props.stage,
      description: props.environment.description,
      monitors: props.environment.monitors,
      tags: props.environment.tags,
    })

    createCfnOutput(`${id}-configurationEnvironmentId`, scope, cdk.Fn.ref(environment.logicalId))
    createCfnOutput(`${id}-configurationEnvironmentName`, scope, environment.name)

    return environment
  }

  /**
   * @summary Method to create an AppConfig Configuration Profile for a given application
   * - <p>&#9888; The <b>locationUri</b> is defaulted to <i>hosted</i> if undefined</p>
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {string} applicationId id of the application
   * @param {AppConfigProps} props
   * @returns {appconfig.CfnConfigurationProfile}
   */
  public createConfigurationProfile(
    id: string,
    scope: CommonConstruct,
    applicationId: string,
    props: AppConfigProps
  ): appconfig.CfnConfigurationProfile {
    if (!props) throw `AppConfig props undefined`

    const profile = new appconfig.CfnConfigurationProfile(scope, `${id}`, {
      applicationId: applicationId,
      locationUri: props.configurationProfile.locationUri || 'hosted',
      name: `${props.configurationProfile.name}-${scope.props.stage}`,
      description: props.configurationProfile.description,
      retrievalRoleArn: props.configurationProfile.retrievalRoleArn,
      tags: props.configurationProfile.tags,
      validators: props.configurationProfile.validators,
    })

    createCfnOutput(`${id}-configurationProfileId`, scope, cdk.Fn.ref(profile.logicalId))
    createCfnOutput(`${id}-configurationProfileName`, scope, profile.name)

    return profile
  }
}
