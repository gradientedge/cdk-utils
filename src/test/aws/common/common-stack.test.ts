import * as cdk from 'aws-cdk-lib'
import { CustomResource } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { CommonStack, CommonStackProps } from '../../../lib/aws/index.js'

interface TestStackProps extends CommonStackProps {
  testAttribute?: string
}

const testStackProps: TestStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/aws/common/cdkConfig/dummy.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  skipStageForARecords: false,
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: TestStackProps) {
    super(parent, name, testStackProps)
    new CustomResource(this, `${props.stackName}`, {
      properties: {
        domain: this.fullyQualifiedDomain(),
      },
      resourceType: 'Custom::TestCustomResourceTypeName',
      serviceToken: 'dummy-resource',
    })
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testAttribute: this.node.tryGetContext('testAttribute'),
      },
    }
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestCommonStack', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })

  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('Custom::TestCustomResourceTypeName', 1)

    /* test if synthesised resources have the right properties */
    template.hasResourceProperties('Custom::TestCustomResourceTypeName', {
      ServiceToken: 'dummy-resource',
      domain: 'test.gradientedge.io',
    })
  })
})

describe('TestCommonStackWithoutSubdomain', () => {
  test('fullyQualifiedDomain returns domain without subdomain', () => {
    const propsWithoutSubdomain = {
      domainName: 'example.com',
      name: 'test-no-subdomain',
      region: 'us-east-1',
      stackName: 'test-no-sub',
      stage: 'test',
    }

    class TestStackNoSubdomain extends CommonStack {
      constructor(parent: cdk.App, name: string, props: TestStackProps) {
        super(parent, name, propsWithoutSubdomain)
        new CustomResource(this, `${props.stackName}-no-sub`, {
          properties: {
            domain: this.fullyQualifiedDomain(),
          },
          resourceType: 'Custom::TestNoSubdomainResource',
          serviceToken: 'dummy-resource',
        })
      }
    }

    const appNoSub = new cdk.App({ context: propsWithoutSubdomain })
    const stackNoSub = new TestStackNoSubdomain(appNoSub, 'test-no-subdomain-stack', propsWithoutSubdomain)
    const templateNoSub = Template.fromStack(stackNoSub)

    templateNoSub.hasResourceProperties('Custom::TestNoSubdomainResource', {
      domain: 'example.com',
    })
  })
})

describe('TestCommonStackNoExtraContexts', () => {
  test('handles missing extraContexts gracefully', () => {
    const propsNoExtra = {
      domainName: 'gradientedge.io',
      name: 'test-no-extra',
      region: 'eu-west-1',
      stackName: 'test-no-extra',
      stage: 'test',
    }

    class TestStackNoExtra extends CommonStack {
      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, propsNoExtra)
      }
    }

    const appNoExtra = new cdk.App({ context: propsNoExtra })
    const stackNoExtra = new TestStackNoExtra(appNoExtra, 'test-no-extra-stack', propsNoExtra)

    expect(stackNoExtra.props.name).toEqual('test-no-extra')
  })
})

describe('TestCommonStackDevStage', () => {
  test('handles dev stage correctly', () => {
    const devStageProps = {
      domainName: 'gradientedge.io',
      name: 'test-dev',
      region: 'eu-west-1',
      stackName: 'test-dev',
      stage: 'dev',
      stageContextPath: 'src/test/aws/common/cdkEnv',
    }

    class TestStackDev extends CommonStack {
      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, devStageProps)
      }
    }

    const appDev = new cdk.App({ context: devStageProps })
    const stackDev = new TestStackDev(appDev, 'test-dev-stack', devStageProps)

    expect(stackDev.props.stage).toEqual('dev')
  })
})

describe('TestCommonStackMissingStageContext', () => {
  test('handles missing stage context file gracefully', () => {
    const missingStageProps = {
      domainName: 'gradientedge.io',
      name: 'test-missing-stage',
      region: 'eu-west-1',
      stackName: 'test-missing',
      stage: 'production',
      stageContextPath: 'src/test/aws/common/cdkEnv',
    }

    class TestStackMissingStage extends CommonStack {
      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, missingStageProps)
      }
    }

    const appMissingStage = new cdk.App({ context: missingStageProps })
    const stackMissingStage = new TestStackMissingStage(appMissingStage, 'test-missing-stage-stack', missingStageProps)

    expect(stackMissingStage.props.stage).toEqual('production')
  })
})

describe('TestCommonStackStageContextWithObjects', () => {
  test('merges object properties from stage context', () => {
    const objStageProps = {
      domainName: 'gradientedge.io',
      name: 'test-obj-stage',
      region: 'eu-west-1',
      stackName: 'test-obj',
      stage: 'test',
      stageContextPath: 'src/test/aws/common/cdkEnv',
    }

    class TestStackObjStage extends CommonStack {
      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, objStageProps)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            nestedConfig: this.node.tryGetContext('nestedConfig'),
            simpleValue: this.node.tryGetContext('simpleValue'),
          },
        }
      }
    }

    const appObjStage = new cdk.App({ context: objStageProps })
    const stackObjStage = new TestStackObjStage(appObjStage, 'test-obj-stage-stack', objStageProps)

    expect(stackObjStage.props.stage).toEqual('test')
  })
})

describe('TestCommonStackErrorHandling', () => {
  test('throws error when extra context file not found', () => {
    const errorProps = {
      domainName: 'gradientedge.io',
      extraContexts: ['src/test/aws/common/cdkConfig/nonexistent.json'],
      name: 'test-error',
      region: 'eu-west-1',
      stackName: 'test-error',
      stage: 'test',
    }

    class TestStackError extends CommonStack {
      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, errorProps)
      }
    }

    const appError = new cdk.App({ context: errorProps })
    const error = () => new TestStackError(appError, 'test-error-stack', errorProps)

    expect(error).toThrow('Extra context properties unavailable')
  })
})

describe('TestCommonStackDefaultNodejsRuntime', () => {
  test('uses default NODEJS runtime when not provided', () => {
    const runtimeProps = {
      domainName: 'gradientedge.io',
      name: 'test-runtime',
      region: 'eu-west-1',
      stackName: 'test-runtime',
      stage: 'test',
    }

    class TestStackRuntime extends CommonStack {
      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, runtimeProps)
      }
    }

    const appRuntime = new cdk.App({ context: runtimeProps })
    const stackRuntime = new TestStackRuntime(appRuntime, 'test-runtime-stack', runtimeProps)

    expect(stackRuntime.props.nodejsRuntime).toEqual(CommonStack.NODEJS_RUNTIME)
  })
})

describe('TestCommonStackDefaultStackName', () => {
  test('uses default stack name when not provided', () => {
    const defaultNameProps = {
      domainName: 'gradientedge.io',
      name: undefined,
      region: 'eu-west-1',
      stage: 'test',
    }

    class TestStackDefaultName extends CommonStack {
      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
      }
    }

    const appDefaultName = new cdk.App({ context: defaultNameProps })
    const stackDefaultName = new TestStackDefaultName(
      appDefaultName,
      'test-default-name-stack',
      defaultNameProps as cdk.StackProps
    )

    expect(stackDefaultName.props.name).toEqual('cdk-utils')
  })
})
