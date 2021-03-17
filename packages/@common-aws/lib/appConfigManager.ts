import * as appconfig from '@aws-cdk/aws-appconfig'
import { CommonConstruct } from './commonConstruct'
import { AppConfigProps, CommonStackProps } from './types'

export class AppConfigManager {
  public createApplication(id: string, scope: CommonConstruct, props: CommonStackProps) {
    if (!props.appConfigs || props.appConfigs.length == 0) throw `AppConfig props undefined`

    const appConfigProps = props.appConfigs.find((appConfig: AppConfigProps) => appConfig.id === id)
    if (!appConfigProps) throw `Could not find AppConfig props for id:${id}`

    return new appconfig.CfnApplication(scope, `${id}Application`, {
      name: `${appConfigProps.application.name}-${scope.props.stage}`,
      description: appConfigProps.application.description,
      tags: appConfigProps.application.tags,
    })
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

    return new appconfig.CfnEnvironment(scope, `${id}Environment`, {
      applicationId: applicationId,
      name: scope.props.stage,
      description: appConfigProps.environment.description,
      monitors: appConfigProps.environment.monitors,
      tags: appConfigProps.environment.tags,
    })
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

    return new appconfig.CfnConfigurationProfile(scope, `${id}ConfigurationProfile`, {
      applicationId: applicationId,
      locationUri: 'hosted',
      name: `${appConfigProps.configurationProfile.name}-${scope.props.stage}`,
      description: appConfigProps.configurationProfile.description,
      retrievalRoleArn: appConfigProps.configurationProfile.retrievalRoleArn,
      tags: appConfigProps.configurationProfile.tags,
      validators: appConfigProps.configurationProfile.validators,
    })
  }
}
