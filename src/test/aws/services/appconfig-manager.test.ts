import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { Architecture, CommonConstruct, CommonStack, CommonStackProps } from '../../../lib/aws/index.js'

interface TestStackProps extends CommonStackProps {
  app: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/configs.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
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

class TestInvalidCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }
}

class TestCommonConstruct extends CommonConstruct {
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
    this.appConfigManager.getArnForAppConfigExtension(this, Architecture.ARM_64)
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
      Description: 'test-application desc',
      Name: 'cdktest-test-application-test',
    })
  })

  test('provisions new environment as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::Environment', {
      Description: 'test-env',
      Name: 'test-env',
    })
  })

  test('provisions new profile as expected', () => {
    template.hasResourceProperties('AWS::AppConfig::ConfigurationProfile', {
      Description: 'test-profile',
      Name: 'cdktest-test-profile-test',
    })
  })
})

describe('TestAppConfigArchitecture', () => {
  test('getArnForAppConfigExtension returns correct ARN for X86_64', () => {
    class TestX86Stack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestX86Construct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            app: this.node.tryGetContext('app'),
          },
        }
      }
    }

    class TestX86Construct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        const arn = this.appConfigManager.getArnForAppConfigExtension(this, Architecture.X86_64)
        expect(arn).toBeDefined()
      }
    }

    const appX86 = new cdk.App({ context: testStackProps })
    new TestX86Stack(appX86, 'test-x86-stack', testStackProps)
  })

  test('getArnForAppConfigExtension throws error for invalid architecture', () => {
    class TestInvalidArchStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestInvalidArchConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            app: this.node.tryGetContext('app'),
          },
        }
      }
    }

    class TestInvalidArchConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.appConfigManager.getArnForAppConfigExtension(this, 'INVALID' as any)
      }
    }

    const appInvalidArch = new cdk.App({ context: testStackProps })
    const error = () => new TestInvalidArchStack(appInvalidArch, 'test-invalid-arch-stack', testStackProps)
    expect(error).toThrow('Invalid type')
  })
})

describe('TestAppConfigDefaults', () => {
  let stackWithDefaults: CommonStack
  let templateWithDefaults: Template

  beforeAll(() => {
    class TestDefaultsStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestDefaultsConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            appWithDefaults: this.node.tryGetContext('appWithDefaults'),
          },
        }
      }
    }

    class TestDefaultsConstruct extends CommonConstruct {
      declare props: any

      constructor(parent: Construct, name: string, props: any) {
        super(parent, name, props)
        const application = this.appConfigManager.createApplication(
          'test-app-defaults',
          this,
          this.props.appWithDefaults
        )
        this.appConfigManager.createEnvironment(
          'test-env-defaults',
          this,
          application.logicalId,
          this.props.appWithDefaults
        )
        this.appConfigManager.createConfigurationProfile(
          'test-profile-defaults',
          this,
          application.logicalId,
          this.props.appWithDefaults
        )
      }
    }

    const appWithDefaults = new cdk.App({ context: testStackProps })
    stackWithDefaults = new TestDefaultsStack(appWithDefaults, 'test-defaults-stack', testStackProps)
    templateWithDefaults = Template.fromStack(stackWithDefaults)
  })

  test('uses default locationUri when not provided', () => {
    templateWithDefaults.hasResourceProperties('AWS::AppConfig::ConfigurationProfile', {
      LocationUri: 'hosted',
    })
  })

  test('uses stage as environment name when not provided', () => {
    templateWithDefaults.hasResourceProperties('AWS::AppConfig::Environment', {
      Name: 'test',
    })
  })
})

describe('TestAppConfigDeploymentStrategy', () => {
  let stackWithStrategy: CommonStack
  let templateWithStrategy: Template

  beforeAll(() => {
    class TestStrategyStack extends CommonStack {
      declare props: any

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestStrategyConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            appWithStrategy: this.node.tryGetContext('appWithStrategy'),
          },
        }
      }
    }

    class TestStrategyConstruct extends CommonConstruct {
      declare props: any

      constructor(parent: Construct, name: string, props: any) {
        super(parent, name, props)
        this.appConfigManager.createDeploymentStrategy('test-strategy', this, this.props.appWithStrategy)
      }
    }

    const appWithStrategy = new cdk.App({ context: testStackProps })
    stackWithStrategy = new TestStrategyStack(appWithStrategy, 'test-strategy-stack', testStackProps)
    templateWithStrategy = Template.fromStack(stackWithStrategy)
  })

  test('creates deployment strategy with defaults', () => {
    templateWithStrategy.resourceCountIs('AWS::AppConfig::DeploymentStrategy', 1)
  })

  test('outputs deployment strategy information', () => {
    templateWithStrategy.hasOutput('testStrategyDeploymentStrategyId', {})
    templateWithStrategy.hasOutput('testStrategyDeploymentStrategyArn', {})
  })
})

describe('TestAppConfigErrorHandling', () => {
  test('throws error when deployment strategy props undefined', () => {
    class TestErrorStrategyStack extends CommonStack {
      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorStrategyConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            app: this.node.tryGetContext('app'),
          },
        }
      }
    }

    class TestErrorStrategyConstruct extends CommonConstruct {
      declare props: any

      constructor(parent: Construct, name: string, props: any) {
        super(parent, name, props)
        const propsWithoutStrategy = { ...this.props.app }
        delete propsWithoutStrategy.deploymentStrategy
        this.appConfigManager.createDeploymentStrategy('test-error-strategy', this, propsWithoutStrategy)
      }
    }

    const appError = new cdk.App({ context: testStackProps })
    const error = () => new TestErrorStrategyStack(appError, 'test-error-strategy-stack', testStackProps)
    expect(error).toThrow('deploymentStrategy props undefined')
  })

  test('throws error when application props undefined', () => {
    class TestErrorAppStack extends CommonStack {
      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorAppConstruct(this, testStackProps.name, this.props)
      }
    }

    class TestErrorAppConstruct extends CommonConstruct {
      constructor(parent: Construct, name: string, props: any) {
        super(parent, name, props)
        this.appConfigManager.createApplication('test-error-app', this, undefined as any)
      }
    }

    const appError = new cdk.App({ context: testStackProps })
    const error = () => new TestErrorAppStack(appError, 'test-error-app-stack', testStackProps)
    expect(error).toThrow('AppConfig props undefined')
  })

  test('throws error when environment props undefined', () => {
    class TestErrorEnvStack extends CommonStack {
      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorEnvConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            app: this.node.tryGetContext('app'),
          },
        }
      }
    }

    class TestErrorEnvConstruct extends CommonConstruct {
      declare props: any

      constructor(parent: Construct, name: string, props: any) {
        super(parent, name, props)
        const application = this.appConfigManager.createApplication('test-error-env-app', this, this.props.app)
        this.appConfigManager.createEnvironment('test-error-env', this, application.logicalId, undefined as any)
      }
    }

    const appError = new cdk.App({ context: testStackProps })
    const error = () => new TestErrorEnvStack(appError, 'test-error-env-stack', testStackProps)
    expect(error).toThrow('AppConfig props undefined')
  })

  test('throws error when configuration profile props undefined', () => {
    class TestErrorProfileStack extends CommonStack {
      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorProfileConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            app: this.node.tryGetContext('app'),
          },
        }
      }
    }

    class TestErrorProfileConstruct extends CommonConstruct {
      declare props: any

      constructor(parent: Construct, name: string, props: any) {
        super(parent, name, props)
        const application = this.appConfigManager.createApplication('test-error-profile-app', this, this.props.app)
        this.appConfigManager.createConfigurationProfile(
          'test-error-profile',
          this,
          application.logicalId,
          undefined as any
        )
      }
    }

    const appError = new cdk.App({ context: testStackProps })
    const error = () => new TestErrorProfileStack(appError, 'test-error-profile-stack', testStackProps)
    expect(error).toThrow('AppConfig props undefined')
  })
})
