import { ConfigurationContent, RolloutStrategy } from '@aws-cdk/aws-appconfig-alpha'
import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import _ from 'lodash'
import { ApplicationConfiguration, ApplicationConfigurationProps, CommonStack } from '../../lib'

interface TestRestApiLambdaProps extends ApplicationConfigurationProps {}

const testRestApiLambdaProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/common/cdkConfig/configs.json'],
  name: 'test-application-configuration-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestRestApiLambdaProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApplicationConfiguration(this, testRestApiLambdaProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      appConfig: this.node.tryGetContext('app'),
    }
  }
}

class TestApplicationConfiguration extends ApplicationConfiguration {
  constructor(parent: Construct, id: string, props: TestRestApiLambdaProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test-application-configuration'
    this.props.appConfig.hostedConfiguration = _.assign(this.props.appConfig.hostedConfiguration, {
      content: ConfigurationContent.fromInlineJson(JSON.stringify({ test: 'value' })),
    })
    this.props.appConfig.deploymentStrategy = _.assign(this.props.appConfig.deploymentStrategy, {
      rolloutStrategy: RolloutStrategy.ALL_AT_ONCE,
    })
    this.initResources()
  }
}

const app = new cdk.App({ context: testRestApiLambdaProps })
const stack = new TestCommonStack(app, 'test-restapi-stack', testRestApiLambdaProps)
const template = Template.fromStack(stack)

describe('TestApplicationConfiguration', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('appConfig')
    expect(stack.props.appConfig.application.name).toEqual('test-application')
  })
})

describe('TestApplicationConfiguration', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::AppConfig::Application', 1)
    template.resourceCountIs('AWS::AppConfig::ConfigurationProfile', 1)
    template.resourceCountIs('AWS::AppConfig::Environment', 1)
    template.resourceCountIs('AWS::AppConfig::HostedConfigurationVersion', 1)
    template.resourceCountIs('AWS::AppConfig::DeploymentStrategy', 2)
    template.resourceCountIs('AWS::AppConfig::Deployment', 1)
  })
})

describe('TestApplicationConfiguration', () => {
  test('outputs as expected', () => {
    template.hasOutput('testApplicationConfigurationAcApplicationApplicationId', {})
    template.hasOutput('testApplicationConfigurationAcApplicationApplicationName', {})
    template.hasOutput('testApplicationConfigurationAcProfileConfigurationProfileId', {})
    template.hasOutput('testApplicationConfigurationAcProfileConfigurationProfileName', {})
    template.hasOutput('testApplicationConfigurationAcEnvironmentConfigurationEnvironmentId', {})
    template.hasOutput('testApplicationConfigurationAcEnvironmentConfigurationEnvironmentName', {})
  })
})

describe('TestApplicationConfiguration', () => {
  test('provisions new application as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::Application', {
      Description: 'test-application desc',
      Name: 'test-application-test',
    })
  })
})

describe('TestApplicationConfiguration', () => {
  test('provisions new profile as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::ConfigurationProfile', {
      Description: 'test-profile',
      Name: 'test-profile-test',
    })
  })
})

describe('TestApplicationConfiguration', () => {
  test('provisions new environment as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::Environment', {
      Description: 'test-env',
      Name: 'test-env',
    })
  })
})

describe('TestApplicationConfiguration', () => {
  test('provisions new configuration version as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::HostedConfigurationVersion', {
      ApplicationId: {
        Ref: 'testapplicationconfigurationstacktestapplicationconfigurationacapplication9CC07873',
      },
      ConfigurationProfileId: {
        Ref: 'testapplicationconfigurationstacktestapplicationconfigurationacprofileConfigurationProfile979AD587',
      },
      Content: '{"test":"value"}',
      ContentType: 'application/json',
    })
  })
})

describe('TestApplicationConfiguration', () => {
  test('provisions new deployment strategy as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::DeploymentStrategy', {
      DeploymentDurationInMinutes: 0,
      GrowthFactor: 100,
      Name: 'test-deployment-strategy-test',
      ReplicateTo: 'NONE',
    })
  })
})

describe('TestApplicationConfiguration', () => {
  test('provisions new deployment as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::Deployment', {
      ApplicationId: {
        Ref: 'testapplicationconfigurationstacktestapplicationconfigurationacapplication9CC07873',
      },
      ConfigurationProfileId: {
        Ref: 'testapplicationconfigurationstacktestapplicationconfigurationacprofileConfigurationProfile979AD587',
      },
      ConfigurationVersion: {
        Ref: 'testapplicationconfigurationstacktestapplicationconfigurationacprofile55397099',
      },
      DeploymentStrategyId: {
        Ref: 'testapplicationconfigurationstacktestapplicationconfigurationacdeploymentstrategyD00939D0',
      },
      EnvironmentId: {
        Ref: 'testapplicationconfigurationstacktestapplicationconfigurationacenvironmentC2A38D11',
      },
    })
  })
})
