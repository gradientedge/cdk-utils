import * as appconfig from '@aws-cdk/aws-appconfig'
import * as cdk from '@aws-cdk/core'
import { CommonConstruct } from './commonConstruct'
import { AppConfigProps, CommonStackProps } from './types'
import { createCfnOutput } from './genericUtils'

export class AppConfigManager {
  public createApplication(id: string, scope: CommonConstruct, props: CommonStackProps) {
    if (!props.appConfigs || props.appConfigs.length == 0) throw `AppConfig props undefined`

    const appConfigProps = props.appConfigs.find((appConfig: AppConfigProps) => appConfig.id === id)
    if (!appConfigProps) throw `Could not find AppConfig props for id:${id}`

    const application = new appconfig.CfnApplication(scope, `${id}Application`, {
      name: `${appConfigProps.application.name}-${scope.props.stage}`,
      description: appConfigProps.application.description,
      tags: appConfigProps.application.tags,
    })

    createCfnOutput(`${id}ApplicationId`, scope, cdk.Fn.ref(application.logicalId))

    return application
  }

  public createEnvironment(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    applicationId: string
  ) {
    if (!props.appConfigs || props.appConfigs.length == 0) throw `AppConfig props undefined`

    const appConfigProps = props.appConfigs.find((appConfig: AppConfigProps) => appConfig.id === id)
    if (!appConfigProps) throw `Could not find AppConfig props for id:${id}`

    const environment = new appconfig.CfnEnvironment(scope, `${id}Environment`, {
      applicationId: applicationId,
      name: scope.props.stage,
      description: appConfigProps.environment.description,
      monitors: appConfigProps.environment.monitors,
      tags: appConfigProps.environment.tags,
    })

    createCfnOutput(`${id}EnvironmentId`, scope, cdk.Fn.ref(environment.logicalId))

    return environment
  }

  public createConfigurationProfile(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    applicationId: string
  ) {
    if (!props.appConfigs || props.appConfigs.length == 0) throw `AppConfig props undefined`

    const appConfigProps = props.appConfigs.find((appConfig: AppConfigProps) => appConfig.id === id)
    if (!appConfigProps) throw `Could not find AppConfig props for id:${id}`

    const profile = new appconfig.CfnConfigurationProfile(scope, `${id}ConfigurationProfile`, {
      applicationId: applicationId,
      locationUri: 'hosted',
      name: `${appConfigProps.configurationProfile.name}-${scope.props.stage}`,
      description: appConfigProps.configurationProfile.description,
      retrievalRoleArn: appConfigProps.configurationProfile.retrievalRoleArn,
      tags: appConfigProps.configurationProfile.tags,
      validators: appConfigProps.configurationProfile.validators,
    })

    createCfnOutput(`${id}ProfileId`, scope, cdk.Fn.ref(profile.logicalId))

    return profile
  }
}
