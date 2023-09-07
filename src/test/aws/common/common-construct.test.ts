import * as cdk from 'aws-cdk-lib'
import { CustomResource } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import * as common from '../../../lib'
import { CommonStackProps } from '../../../lib'

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

class TestCommonStack extends common.CommonStack {
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

class TestCommonConstruct extends common.CommonConstruct {
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
