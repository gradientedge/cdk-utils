import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testLambda: any
  logLevel?: string
  apiSubDomain?: string
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['packages/aws/test/common/cdk-config/base.json', 'packages/aws/test/common/cdk-config/lambdas.json'],
  regionContextPath: 'packages/aws/test/common/cdk-region',
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdk-env',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, testStackProps)
    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      testLambda: this.node.tryGetContext('testLambda'),
      logLevel: this.node.tryGetContext('logLevel'),
      globalPrefix: this.node.tryGetContext('globalPrefix'),
      apiSubDomain: this.node.tryGetContext('apiSubDomain'),
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testRole = this.iamManager.createRoleForLambda(
      'test-role',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    )
    this.lambdaManager.createLambdaFunction(
      'test-lambda',
      this,
      this.props.testLambda,
      testRole,
      [],
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-lambda-hierarchy-stack', testStackProps)
const template = Template.fromStack(stack)

describe('LambdaManager - Region Context Hierarchy', () => {
  test('stage > region > base: logLevel set in all 3 layers, stage wins', () => {
    // base(base.json)='error', region(eu-west-1.json)='warn', stage(test.json)='debug'
    expect(stack.props.logLevel).toEqual('debug')
  })

  test('stage > region > base: resourcePrefix set in all 3 layers, stage wins', () => {
    // base(base.json)='ge', region(eu-west-1.json)='ge-eu-west-1', stage(test.json)='cdktest'
    expect(stack.props.resourcePrefix).toEqual('cdktest')
  })

  test('base only: globalPrefix set only in base, survives through region and stage', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })

  test('stage > region: subDomain set in region and stage, stage wins', () => {
    // region(eu-west-1.json)='eu', stage(test.json)='test'
    expect(stack.props.subDomain).toEqual('test')
  })

  test('stage > region: apiSubDomain set in region and stage, stage wins', () => {
    // region(eu-west-1.json)='api-eu', stage(test.json)='api'
    expect(stack.props.apiSubDomain).toEqual('api')
  })

  test('resource-level region > base: lambda uses 512MB memory and 30s timeout from eu-west-1 region context', () => {
    // testLambda.memorySize: base(lambdas.json)=1024, region(eu-west-1-lambdas.json)=512
    // testLambda.timeoutInSecs: base(lambdas.json)=60, region(eu-west-1-lambdas.json)=30
    // stage does not set testLambda → region wins over base
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'cdktest-test-lambda-test',
      MemorySize: 512,
      Timeout: 30,
      Environment: {
        Variables: {
          LOG_LEVEL: 'info',
          REGION: 'eu-west-1',
        },
      },
      Tags: [
        { Key: 'testTagName1', Value: 'testTagValue1' },
        { Key: 'testTagName2', Value: 'testTagValue2' },
      ],
    })
  })
})
