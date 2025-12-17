import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib/aws/index.js'

interface TestStackProps extends CommonStackProps {}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [],
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
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps
  paramValue: string
  paramValueFromRegion: string

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.ssmManager.writeStringToParameters('test-param-write', this, {
      description: `test param description`,
      parameterName: 'test-param',
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
      Description: 'test param description - test stage',
      Name: 'cdktest-test-param-test',
      Type: 'String',
      Value: 'Hello World!',
    })
  })
})
