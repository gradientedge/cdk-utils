import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import * as types from '../../lib/types'

interface TestStackProps extends types.CommonStackProps {
  app: any
}

const testStackProps = {
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  name: 'test-common-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  extraContexts: ['src/test/common/cdkConfig/configs.json'],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends common.CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        app: this.node.tryGetContext('app'),
        appConfigurationProfile: this.node.tryGetContext('appConfigurationProfile'),
      },
    }
  }
}

class TestInvalidCommonStack extends common.CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }
}

class TestCommonConstruct extends common.CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const application = this.appConfigManager.createApplication('test-application', this, this.props.app)
    this.appConfigManager.createEnvironment('test-environment', this, application.logicalId, this.props.app)
    this.appConfigManager.createConfigurationProfile(
      'test-configuration-profile',
      this,
      application.logicalId,
      this.props.app
    )
    this.appConfigManager.getArnForAppConfigExtension(this)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestAppConfigConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('AppConfig props undefined')
  })
})

describe('TestAppConfigConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props.app.application.name).toEqual('test-application')
    expect(commonStack.props.app.environment.name).toEqual('test-env')
    expect(commonStack.props.app.configurationProfile.name).toEqual('test-profile')
  })
})

describe('TestAppConfigConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::AppConfig::Application', 1)
    template.resourceCountIs('AWS::AppConfig::Environment', 1)
    template.resourceCountIs('AWS::AppConfig::ConfigurationProfile', 1)
  })
})

describe('TestAppConfigConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testApplicationApplicationId', {})
    template.hasOutput('testApplicationApplicationName', {})
    template.hasOutput('testEnvironmentConfigurationEnvironmentId', {})
    template.hasOutput('testEnvironmentConfigurationEnvironmentName', {})
    template.hasOutput('testConfigurationProfileConfigurationProfileId', {})
    template.hasOutput('testConfigurationProfileConfigurationProfileName', {})
  })
})

describe('TestAppConfigConstruct', () => {
  test('provisions new application as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::Application', {
      Name: 'test-application-test',
      Description: 'test-application desc',
    })
  })

  test('provisions new environment as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::Environment', {
      Name: 'test-env',
      Description: 'test-env',
    })
  })

  test('provisions new profile as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::ConfigurationProfile', {
      Name: 'test-profile-test',
      Description: 'test-profile',
    })
  })
})
