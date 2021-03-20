import * as appconfig from '@aws-cdk/aws-appconfig'
import * as cdk from '@aws-cdk/core'
import { CommonConstruct } from './commonConstruct'
import { AppConfigProps } from './types'
import { createCfnOutput } from './genericUtils'

/**
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
 * @classdesc Provides operations on AWS AppConfig.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/common-aws/lib/commonConstruct'
 * import { CommonStackProps } from '@gradientedge/common-aws/lib/types'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.appConfigManager.createApplication('MyApplication', this)
 * }
 *
 * @see [AppConfig Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-appconfig-readme.html}</li></i>
 */
export class AppConfigManager {
  public getArnForAppConfigExtension(scope: CommonConstruct) {
    return ArnsByRegion[scope.props.region]
  }

  /**
   * @summary Method to create an AppConfig Application
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @returns {appconfig.CfnApplication}
   */
  public createApplication(id: string, scope: CommonConstruct): appconfig.CfnApplication {
    if (!scope.props.appConfigs || scope.props.appConfigs.length == 0)
      throw `AppConfig props undefined`

    const appConfigProps = scope.props.appConfigs.find(
      (appConfig: AppConfigProps) => appConfig.id === id
    )
    if (!appConfigProps) throw `Could not find AppConfig props for id:${id}`

    const application = new appconfig.CfnApplication(scope, `${id}Application`, {
      name: `${appConfigProps.application.name}-${scope.props.stage}`,
      description: appConfigProps.application.description,
      tags: appConfigProps.application.tags,
    })

    createCfnOutput(`${id}ApplicationId`, scope, cdk.Fn.ref(application.logicalId))
    createCfnOutput(`${id}ApplicationName`, scope, application.name)

    return application
  }

  /**
   * @summary Method to create an AppConfig Environment for a given application
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {string} applicationId id of the application
   * @returns {appconfig.CfnEnvironment}
   */
  public createEnvironment(
    id: string,
    scope: CommonConstruct,
    applicationId: string
  ): appconfig.CfnEnvironment {
    if (!scope.props.appConfigs || scope.props.appConfigs.length == 0)
      throw `AppConfig props undefined`

    const appConfigProps = scope.props.appConfigs.find(
      (appConfig: AppConfigProps) => appConfig.id === id
    )
    if (!appConfigProps) throw `Could not find AppConfig props for id:${id}`

    const environment = new appconfig.CfnEnvironment(scope, `${id}Environment`, {
      applicationId: applicationId,
      name: scope.props.stage,
      description: appConfigProps.environment.description,
      monitors: appConfigProps.environment.monitors,
      tags: appConfigProps.environment.tags,
    })

    createCfnOutput(`${id}EnvironmentId`, scope, cdk.Fn.ref(environment.logicalId))
    createCfnOutput(`${id}EnvironmentName`, scope, environment.name)

    return environment
  }

  /**
   * @summary Method to create an AppConfig Configuration Profile for a given application
   * - <p>&#9888; The <b>locationUri</b> is defaulted to <i>hosted</i> if undefined</p>
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {string} applicationId id of the application
   * @returns {appconfig.CfnConfigurationProfile}
   */
  public createConfigurationProfile(
    id: string,
    scope: CommonConstruct,
    applicationId: string
  ): appconfig.CfnConfigurationProfile {
    if (!scope.props.appConfigs || scope.props.appConfigs.length == 0)
      throw `AppConfig props undefined`

    const appConfigProps = scope.props.appConfigs.find(
      (appConfig: AppConfigProps) => appConfig.id === id
    )
    if (!appConfigProps) throw `Could not find AppConfig props for id:${id}`

    const profile = new appconfig.CfnConfigurationProfile(scope, `${id}ConfigurationProfile`, {
      applicationId: applicationId,
      locationUri: appConfigProps.configurationProfile.locationUri || 'hosted',
      name: `${appConfigProps.configurationProfile.name}-${scope.props.stage}`,
      description: appConfigProps.configurationProfile.description,
      retrievalRoleArn: appConfigProps.configurationProfile.retrievalRoleArn,
      tags: appConfigProps.configurationProfile.tags,
      validators: appConfigProps.configurationProfile.validators,
    })

    createCfnOutput(`${id}ProfileId`, scope, cdk.Fn.ref(profile.logicalId))
    createCfnOutput(`${id}ProfileName`, scope, profile.name)

    return profile
  }
}
