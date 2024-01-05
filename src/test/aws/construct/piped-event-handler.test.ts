import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { PolicyDocument } from 'aws-cdk-lib/aws-iam'
import { AssetCode, IFunction } from 'aws-cdk-lib/aws-lambda'
import { Chain, Succeed } from 'aws-cdk-lib/aws-stepfunctions'
import { Construct } from 'constructs'
import { CommonStack, PipedEventHandler, PipedEventHandlerProps } from '../../../lib'

interface TestStackProps extends PipedEventHandlerProps {
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

    this.construct = new TestPipedEventHandler(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      eventRetentionInDays: 7,
      eventRule: this.node.tryGetContext('testRule'),
      pipedDlq: this.node.tryGetContext('testPipedDlq'),
      pipedQueue: this.node.tryGetContext('testPipedQueue'),
      sqsToLambdaPipe: this.node.tryGetContext('testSqsToLambdaPipe'),
      sqsToSfnPipe: this.node.tryGetContext('testSqsToSfnPipe'),
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

class TestPipedEventHandler extends PipedEventHandler {
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
    this.handler.lambdaFunctions = [this.testLambda]
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

describe('TestPipedEventHandler', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('region')
    expect(stack.props.region).toEqual('eu-west-1')
  })
})

describe('TestPipedEventHandler', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::IAM::Role', 5)
    template.resourceCountIs('AWS::IAM::Policy', 4)
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('AWS::SQS::Queue', 2)
    template.resourceCountIs('AWS::SQS::QueuePolicy', 1)
    template.resourceCountIs('AWS::Logs::LogGroup', 1)
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1)
    template.resourceCountIs('AWS::Pipes::Pipe', 2)
    template.resourceCountIs('AWS::Events::Rule', 1)
  })
})

describe('TestPipedEventHandler', () => {
  test('outputs as expected', () => {
    template.hasOutput('testRoleArn', {})
    template.hasOutput('testRoleName', {})
    template.hasOutput('testLambdaLambdaArn', {})
    template.hasOutput('testLambdaLambdaName', {})
    template.hasOutput('testPipeQueueDlqQueueArn', {})
    template.hasOutput('testPipeQueueDlqQueueName', {})
    template.hasOutput('testPipeQueueDlqQueueUrl', {})
    template.hasOutput('testPipeQueueQueueArn', {})
    template.hasOutput('testPipeQueueQueueName', {})
    template.hasOutput('testPipeQueueQueueUrl', {})
    template.hasOutput('testWorkflowRoleArn', {})
    template.hasOutput('testWorkflowRoleName', {})
    template.hasOutput('testWorkflowLogLogGroupArn', {})
    template.hasOutput('testWorkflowStateMachineName', {})
    template.hasOutput('testWorkflowStateMachineArn', {})
    template.hasOutput('testRuleRuleArn', {})
    template.hasOutput('testRuleRuleName', {})
    template.hasOutput('testPipeSfnRoleArn', {})
    template.hasOutput('testPipeSfnRoleName', {})
    template.hasOutput('testPipeSfnPipeArn', {})
    template.hasOutput('testPipeSfnPipeName', {})
    template.hasOutput('testPipeLambda0RoleArn', {})
    template.hasOutput('testPipeLambda0RoleName', {})
    template.hasOutput('testPipeLambda0PipeArn', {})
    template.hasOutput('testPipeLambda0PipeName', {})
  })
})

describe('TestPipedEventHandler', () => {
  test('provisions event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: { 'detail-type': ['Test'] },
      Name: 'test-rule-test',
      State: 'ENABLED',
      Targets: [{ Arn: { 'Fn::GetAtt': ['testapistacktestpipequeue5A230831', 'Arn'] }, Id: 'Target0' }],
    })
  })
})

describe('TestPipedEventHandler', () => {
  test('provisions map itertor step function as expected', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString:
        '{"StartAt":"Map Iterator","States":{"Map Iterator":{"Type":"Map","End":true,"ItemsPath":"$","ItemProcessor":{"ProcessorConfig":{"Mode":"INLINE"},"StartAt":"workflow:Complete","States":{"workflow:Complete":{"Type":"Succeed","Comment":"Succeed step for workflow:Complete - test stage"}}},"MaxConcurrency":1}}}',
      LoggingConfiguration: {
        Destinations: [
          {
            CloudWatchLogsLogGroup: {
              LogGroupArn: { 'Fn::GetAtt': ['testapistacktestworkflowlog72A41454', 'Arn'] },
            },
          },
        ],
        IncludeExecutionData: true,
        Level: 'ALL',
      },
      RoleArn: { 'Fn::GetAtt': ['testapistacktestworkflowroleCDE15AC1', 'Arn'] },
      StateMachineName: 'test-workflow-test',
      StateMachineType: 'STANDARD',
    })
  })
})

describe('TestPipedEventHandler', () => {
  test('provisions pipes as expected', () => {
    template.hasResourceProperties('AWS::Pipes::Pipe', {
      Name: 'test-sqs-to-sfn-pipe-test',
      RoleArn: { 'Fn::GetAtt': ['testapistacktestpipesfnroleEDFDEB2D', 'Arn'] },
      Source: { 'Fn::GetAtt': ['testapistacktestpipequeue5A230831', 'Arn'] },
      SourceParameters: {
        FilterCriteria: { Filters: [{ Pattern: '{"detail":{"type":["testType"]}}' }] },
        SqsQueueParameters: { BatchSize: 10 },
      },
      Target: { Ref: 'testapistacktestworkflowBCC50DF3' },
      TargetParameters: {
        InputTemplate: '<$.body>',
        StepFunctionStateMachineParameters: { InvocationType: 'FIRE_AND_FORGET' },
      },
    })
    template.hasResourceProperties('AWS::Pipes::Pipe', {
      Name: 'test-sqs-to-lambda-pipe-test',
      RoleArn: { 'Fn::GetAtt': ['testapistacktestpipelambda0role731A03AA', 'Arn'] },
      Source: { 'Fn::GetAtt': ['testapistacktestpipequeue5A230831', 'Arn'] },
      SourceParameters: {
        FilterCriteria: { Filters: [{ Pattern: '{"detail":{"type":["testType"]}}' }] },
        SqsQueueParameters: { BatchSize: 10 },
      },
      Target: { 'Fn::GetAtt': ['testapistacktestlambdaE20C288B', 'Arn'] },
    })
  })
})
