import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../lib'

interface TestStackProps extends CommonStackProps {}

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
  extraContexts: [],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps
  paramValue: string
  paramValueFromRegion: string

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.ssmManager.writeStringToParameters('test-param-write', this, {
      parameterName: 'test-param',
      description: `test param description`,
      stringValue: 'Hello World!',
    })
    this.paramValue = this.ssmManager.readStringParameter('test-param-read', this, 'test-param-test')
    this.paramValueFromRegion = this.ssmManager.readStringParameterFromRegion(
      'test-param-read-from-region',
      this,
      'test-param-test',
      'eu-west-1'
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestSsmConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::SSM::Parameter', 1)
  })
})

describe('TestSsmConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testParamWriteParameterArn', {})
    template.hasOutput('testParamWriteParameterName', {})
  })
})

describe('TestSsmConstruct', () => {
  test('provisions new ip set as expected', () => {
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Type: 'String',
      Value: 'Hello World!',
      Description: 'test param description - test stage',
      Name: 'test-param-test',
    })
  })
})
