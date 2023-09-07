import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'

interface TestStackProps extends CommonStackProps {
  testCluster: any
  testFargateRule: any
  testLambda: any
  testLambdaRule: any
  testLogGroup: any
  testSqs: any
  testSqsToSfnPipe: any
  testSubmitStepCreateSomething: any
  testSubmitStepSuccess: any
  testSubmitWorkflow: any
  testTask: any
  testVpc: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'src/test/aws/common/cdkConfig/ecs.json',
    'src/test/aws/common/cdkConfig/lambdas.json',
    'src/test/aws/common/cdkConfig/logs.json',
    'src/test/aws/common/cdkConfig/pipes.json',
    'src/test/aws/common/cdkConfig/rules.json',
    'src/test/aws/common/cdkConfig/sqs.json',
    'src/test/aws/common/cdkConfig/stepFunctions.json',
    'src/test/aws/common/cdkConfig/vpc.json',
  ],
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

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testCluster: this.node.tryGetContext('testCluster'),
        testFargateRule: this.node.tryGetContext('testLambda'),
        testLambda: this.node.tryGetContext('testLambda'),
        testLambdaRule: this.node.tryGetContext('testLambda'),
        testLogGroup: this.node.tryGetContext('testLogGroup'),
        testSqs: this.node.tryGetContext('testSqs'),
        testSqsToSfnPipe: this.node.tryGetContext('testSqsToSfnPipe'),
        testSubmitStepCreateSomething: this.node.tryGetContext('testSubmitStepCreateSomething'),
        testSubmitStepSuccess: this.node.tryGetContext('testSubmitStepSuccess'),
        testSubmitWorkflow: this.node.tryGetContext('testSubmitWorkflow'),
        testTask: this.node.tryGetContext('testTask'),
        testVpc: this.node.tryGetContext('testVpc'),
      },
    }
  }
}

class TestInvalidCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testCluster: this.node.tryGetContext('testCluster'),
        testLambda: this.node.tryGetContext('testLambda'),
        testLogGroup: this.node.tryGetContext('testLogGroup'),
        testSqs: this.node.tryGetContext('testSqs'),
        testSqsToSfnPipe: this.node.tryGetContext('testSqsToSfnPipe'),
        testSubmitStepCreateSomething: this.node.tryGetContext('testSubmitStepCreateSomething'),
        testSubmitStepSuccess: this.node.tryGetContext('testSubmitStepSuccess'),
        testSubmitWorkflow: this.node.tryGetContext('testSubmitWorkflow'),
        testTask: this.node.tryGetContext('testTask'),
        testVpc: this.node.tryGetContext('testVpc'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testVpc = this.vpcManager.createCommonVpc(this, this.props.testVpc)
    const testCluster = this.ecsManager.createEcsCluster('test-cluster', this, this.props.testCluster, testVpc)
    const testImage = ecs.ContainerImage.fromAsset('src/test/aws/common/docker')
    const testLogGroup = this.logManager.createLogGroup('test-log-group', this, this.props.testLogGroup)
    const testPolicy = new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    const testRole = this.iamManager.createRoleForEcsExecution('test-role', this, testPolicy)
    const testTask = this.ecsManager.createEcsFargateTask(
      'test-task',
      this,
      this.props.testTask,
      testCluster,
      testRole,
      testLogGroup,
      testImage
    )
    const testRoleForEvent = this.iamManager.createRoleForEcsEvent('test-ecs-role', this, testCluster, testTask)
    this.eventManager.createFargateTaskRule(
      'test-fargate-rule',
      this,
      this.props.testFargateRule,
      testCluster,
      testTask,
      [],
      testRoleForEvent
    )

    const testLambda = this.lambdaManager.createLambdaFunction(
      'test-lambda',
      this,
      this.props.testLambda,
      testRole,
      [],
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    )
    this.eventManager.createLambdaRule('test-lambda-rule', this, this.props.testLambdaRule, testLambda)

    const testQueue = this.sqsManager.createQueue('test-sqs', this, this.props.testSqs)
    const testSubmitStepCreateSomething = this.sfnManager.createLambdaStep(
      'test-choice-step-2',
      this,
      this.props.testSubmitStepCreateSomething,
      testLambda
    )
    const testSubmitStepSuccess = this.sfnManager.createSuccessStep(
      'test-pass-step',
      this,
      this.props.testSubmitStepSuccess
    )
    const testWorkflow = sfn.Chain.start(testSubmitStepCreateSomething).next(testSubmitStepSuccess)
    const testStateMachine = this.sfnManager.createStateMachine(
      'test-parallel-step',
      this,
      this.props.testSubmitWorkflow,
      testWorkflow,
      testLogGroup
    )
    this.eventManager.createSqsToSfnCfnPipe(
      'test-sqs-to-sfn-pipe',
      this,
      this.props.testSqsToSfnPipe,
      testQueue,
      testStateMachine
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestEventConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('EventRule props undefined')
  })
})

describe('TestEventConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Events::Rule', 2)
    template.resourceCountIs('AWS::Lambda::Permission', 1)
    template.resourceCountIs('AWS::SQS::Queue', 1)
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1)
    template.resourceCountIs('AWS::Pipes::Pipe', 1)
  })
})

describe('TestEventConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testFargateRuleRuleArn', {})
    template.hasOutput('testFargateRuleRuleName', {})
    template.hasOutput('testLambdaRuleRuleArn', {})
    template.hasOutput('testLambdaRuleRuleName', {})
    template.hasOutput('testSqsQueueArn', {})
    template.hasOutput('testSqsQueueName', {})
    template.hasOutput('testSqsQueueUrl', {})
    template.hasOutput('testParallelStepStateMachineName', {})
    template.hasOutput('testParallelStepStateMachineArn', {})
    template.hasOutput('testSqsToSfnPipeRoleArn', {})
    template.hasOutput('testSqsToSfnPipeRoleName', {})
    template.hasOutput('testSqsToSfnPipePipeArn', {})
    template.hasOutput('testSqsToSfnPipePipeName', {})
  })
})

describe('TestEventConstruct', () => {
  test('provisions new fargate event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Rule to send notification on new objects in data bucket to ecs task target',
      Targets: [
        {
          Arn: {
            'Fn::GetAtt': ['testcommonstacktestclusterBBE459F3', 'Arn'],
          },
          EcsParameters: {
            LaunchType: 'FARGATE',
            NetworkConfiguration: {
              AwsVpcConfiguration: {
                AssignPublicIp: 'ENABLED',
                Subnets: [],
              },
            },
            TaskCount: 1,
            TaskDefinitionArn: {
              Ref: 'testcommonstacktesttask23AF6E18',
            },
          },
          Id: 'test-fargate-rule-test',
          RoleArn: {
            'Fn::GetAtt': ['testcommonstacktestecsrole9F6D8BF8', 'Arn'],
          },
        },
      ],
    })
  })

  test('provisions new lambda event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Rule to send notification to lambda function target',
      Targets: [
        {
          Arn: {
            'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
          },
          Id: 'test-lambda-rule-test',
        },
      ],
    })
  })
})

describe('TestEventConstruct', () => {
  test('provisions new eventbridge pipe as expected', () => {
    template.hasResourceProperties('AWS::Pipes::Pipe', {
      Name: 'test-sqs-to-sfn-pipe-test',
      RoleArn: {
        'Fn::GetAtt': ['testcommonstacktestsqstosfnpiperole2EFA5C05', 'Arn'],
      },
      Source: {
        'Fn::GetAtt': ['testcommonstacktestsqs99C34404', 'Arn'],
      },
      SourceParameters: {
        FilterCriteria: {
          Filters: [
            {
              Pattern: '{"detail":{"type":["testType"]}}',
            },
          ],
        },
        SqsQueueParameters: {
          BatchSize: 10,
        },
      },
      Target: {
        Ref: 'testcommonstacktestparallelstep535C7CF2',
      },
      TargetParameters: {
        InputTemplate: '<$.body>',
        StepFunctionStateMachineParameters: {
          InvocationType: 'FIRE_AND_FORGET',
        },
      },
    })
  })
})
