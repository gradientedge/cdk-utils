import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { PolicyDocument } from 'aws-cdk-lib/aws-iam'
import { AssetCode, IFunction } from 'aws-cdk-lib/aws-lambda'
import { Chain, Succeed } from 'aws-cdk-lib/aws-stepfunctions'
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
      eventRetentionInDays: 7,
      eventRule: this.node.tryGetContext('testRule'),
      eventSqs: this.node.tryGetContext('testSqs'),
      testLambda: this.node.tryGetContext('testLambda'),
      useExistingVpc: false,
      vpc: this.node.tryGetContext('testIPV6Vpc'),
      workflow: this.node.tryGetContext('testSubmitWorkflow'),
      workflowLog: this.node.tryGetContext('testLogGroup'),
      workflowMapState: this.node.tryGetContext('testWorkflowMapState'),
      workflowStepSuccess: this.node.tryGetContext('testSubmitStepSuccess'),
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

  protected initResources() {
    const testPolicy = new PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    const testRole = this.iamManager.createRoleForEcsExecution('test-role', this, testPolicy)
    this.testLambda = this.lambdaManager.createLambdaFunction(
      'test-lambda',
      this,
      this.props.testLambda,
      testRole,
      [],
      new AssetCode('src/test/aws/common/nodejs/lib')
    )
    this.handler.lambdaTargets = [new LambdaFunction(this.testLambda)]
    super.initResources()
  }

  protected createWorkflowSteps() {
    super.createWorkflowSteps()
    this.workflowStepSuccess = this.sfnManager.createSuccessStep(
      `${this.id}-workflow-complete`,
      this,
      this.props.workflowStepSuccess
    )
  }

  protected createWorkflowDefinition() {
    this.handler.eventWorkflowDefinition = Chain.start(this.workflowStepSuccess)
    super.createWorkflowDefinition()
  }

  protected createWorkflowPolicy() {
    this.handler.workflowPolicy = new PolicyDocument({
      statements: [this.iamManager.statementForInvokeLambda([this.testLambda.functionArn])],
    })
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-api-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestEventHandler', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('region')
    expect(stack.props.region).toEqual('eu-west-1')
  })
})

describe('TestEventHandler', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::IAM::Role', 4)
    template.resourceCountIs('AWS::IAM::Policy', 3)
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('AWS::Lambda::Permission', 1)
    template.resourceCountIs('AWS::SQS::Queue', 1)
    template.resourceCountIs('AWS::SQS::QueuePolicy', 2)
    template.resourceCountIs('AWS::Logs::LogGroup', 1)
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1)
    template.resourceCountIs('AWS::Events::Rule', 1)
  })
})

describe('TestEventHandler', () => {
  test('outputs as expected', () => {
    template.hasOutput('testRoleArn', {})
    template.hasOutput('testRoleName', {})
    template.hasOutput('testLambdaLambdaArn', {})
    template.hasOutput('testLambdaLambdaName', {})
    template.hasOutput('testSqsQueueQueueArn', {})
    template.hasOutput('testSqsQueueQueueName', {})
    template.hasOutput('testSqsQueueQueueUrl', {})
    template.hasOutput('testWorkflowRoleArn', {})
    template.hasOutput('testWorkflowRoleName', {})
    template.hasOutput('testWorkflowLogLogGroupArn', {})
    template.hasOutput('testWorkflowStateMachineName', {})
    template.hasOutput('testWorkflowStateMachineArn', {})
    template.hasOutput('testRuleRuleArn', {})
    template.hasOutput('testRuleRuleName', {})
  })
})

describe('TestEventHandler', () => {
  test('provisions event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: { 'detail-type': ['Test'] },
      Name: 'test-rule-test',
      State: 'ENABLED',
      Targets: [
        {
          Arn: { Ref: 'testapistacktestworkflowBCC50DF3' },
          Id: 'Target0',
          RoleArn: { 'Fn::GetAtt': ['testapistacktestworkflowEventsRole4C966582', 'Arn'] },
        },
        { Arn: { 'Fn::GetAtt': ['testapistacktestlambdaE20C288B', 'Arn'] }, Id: 'Target1' },
        { Arn: { 'Fn::GetAtt': ['testapistacktestsqsqueueFFC5E099', 'Arn'] }, Id: 'Target2' },
      ],
    })
  })
})
