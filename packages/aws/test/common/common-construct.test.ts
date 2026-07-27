import * as cdk from 'aws-cdk-lib'
import { CustomResource } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testAttribute?: string
}

const testStackProps: TestStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/aws/test/common/cdk-config/dummy.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  skipStageForARecords: false,
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdk-env',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: TestStackProps) {
    super(parent, name, testStackProps)

    this.construct = new TestCommonConstruct(this, props.name, this.props)
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

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    new CustomResource(this, `${props.stackName}`, {
      properties: {
        domain: this.fullyQualifiedDomainName,
      },
      resourceType: 'Custom::TestCustomResourceTypeName',
      serviceToken: 'dummy-resource',
    })
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

const createTestConstructWithStage = (stage: string, subDomain?: string) => {
  const tempApp = new cdk.App()
  const stackSuffix = subDomain === undefined ? 'root' : subDomain
  const tempStack = new cdk.Stack(tempApp, `test-common-stack-${stage}-${stackSuffix}`)
  return new TestCommonConstruct(tempStack, `test-common-construct-${stage}-${subDomain || 'root'}`, {
    ...testStackProps,
    stage,
    subDomain: subDomain ?? 'test',
  } as TestStackProps)
}

describe('TestCommonConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCommonConstruct', () => {
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

describe('ResourceNameFormatter', () => {
  test('formats with exclude option', () => {
    const construct = commonStack.construct as TestCommonConstruct
    const result = construct.resourceNameFormatter.format('my-resource', { exclude: true })
    expect(result).toContain('my-resource')
    expect(result).toContain('test')
  })

  test('formats with globalPrefix option', () => {
    const construct = commonStack.construct as TestCommonConstruct
    const result = construct.resourceNameFormatter.format('my-resource', { globalPrefix: true })
    expect(result).toContain('my-resource')
  })

  test('formats with globalSuffix option', () => {
    const construct = commonStack.construct as TestCommonConstruct
    const result = construct.resourceNameFormatter.format('my-resource', { globalSuffix: true })
    expect(result).toContain('my-resource')
  })

  test('formats with custom prefix and suffix', () => {
    const construct = commonStack.construct as TestCommonConstruct
    const result = construct.resourceNameFormatter.format('my-resource', {
      prefix: 'custom-prefix',
      suffix: 'custom-suffix',
    })
    expect(result).toContain('custom-prefix')
    expect(result).toContain('custom-suffix')
    expect(result).toContain('my-resource')
  })
})

describe('CommonConstruct stage helpers', () => {
  test('evaluates stage helper methods for test stage', () => {
    const testConstruct = createTestConstructWithStage('tst')
    expect(testConstruct.isDevelopmentStage()).toBe(false)
    expect(testConstruct.isTestStage()).toBe(true)
    expect(testConstruct.isUatStage()).toBe(false)
    expect(testConstruct.isProductionStage()).toBe(false)
  })

  test('evaluates production stage as expected', () => {
    const productionConstruct = createTestConstructWithStage('prd')
    expect(productionConstruct.isProductionStage()).toBe(true)
    expect(productionConstruct.isTestStage()).toBe(false)
  })
})

describe('CommonConstruct domain resolution', () => {
  test('uses root domain when subDomain is undefined', () => {
    const tempApp = new cdk.App()
    const tempStack = new cdk.Stack(tempApp, 'test-common-stack-tst-root')
    const constructNoSubdomain = new TestCommonConstruct(tempStack, 'test-common-construct-tst-root', {
      ...testStackProps,
      stage: 'tst',
      subDomain: undefined,
    } as TestStackProps)

    expect(constructNoSubdomain.fullyQualifiedDomainName).toEqual('gradientedge.io')
  })
})
