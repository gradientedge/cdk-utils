import * as cdk from 'aws-cdk-lib'
import { CustomResource } from 'aws-cdk-lib'
import { CommonStack } from '../../lib/common/commonStack'
import { Template } from 'aws-cdk-lib/assertions'
import { CommonStackProps } from '../../lib/types'

interface TestStackProps extends CommonStackProps {
  testAttribute?: string
}

const testStackProps: TestStackProps = {
  name: 'test-common-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  extraContexts: ['src/test/common/cdkConfig/dummy.json'],
  stageContextPath: 'src/test/common/cdkEnv',
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
})

describe('TestCommonStack', () => {
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