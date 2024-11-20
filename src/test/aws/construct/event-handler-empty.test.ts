import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { Succeed } from 'aws-cdk-lib/aws-stepfunctions'
import { Construct } from 'constructs'
import { CommonStack, EventHandler, EventHandlerProps } from '../../../lib'

interface TestStackProps extends EventHandlerProps {
  testLambda: any
  workflowStepSuccess: any
}

const testStackProps = {
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'src/test/aws/common/cdkConfig/lambdas.json',
    'src/test/aws/common/cdkConfig/logs.json',
    'src/test/aws/common/cdkConfig/pipes.json',
    'src/test/aws/common/cdkConfig/rules.json',
    'src/test/aws/common/cdkConfig/sqs.json',
    'src/test/aws/common/cdkConfig/stepFunctions.json',
    'src/test/aws/common/cdkConfig/vpc.json',
  ],
  name: 'test-api-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestEventHandler(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
    }
  }
}

class TestEventHandler extends EventHandler {
  declare props: TestStackProps
  workflowStepSuccess: Succeed
  testLambda: IFunction

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props
    this.id = 'test'
    this.initResources()
  }

  public initResources() {
    super.initResources()
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-api-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestEventHandler empty', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('region')
    expect(stack.props.region).toEqual('eu-west-1')
  })
})

describe('TestEventHandler empty', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::IAM::Role', 0)
    template.resourceCountIs('AWS::IAM::Policy', 0)
    template.resourceCountIs('AWS::Lambda::Function', 0)
    template.resourceCountIs('AWS::Lambda::Permission', 0)
    template.resourceCountIs('AWS::SQS::Queue', 0)
    template.resourceCountIs('AWS::SQS::QueuePolicy', 0)
    template.resourceCountIs('AWS::Logs::LogGroup', 0)
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 0)
    template.resourceCountIs('AWS::Events::Rule', 0)
  })
})
