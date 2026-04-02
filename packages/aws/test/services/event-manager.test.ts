import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testCluster: any
  testDynamoDbToLambdaPipe: any
  testFargateRule: any
  testLambda: any
  testLambdaRule: any
  testLambdaRuleWithTags: any
  testLambdaRuleWithSchedule: any
  testLambdaRuleWithInput: any
  testLogGroup: any
  testRule: any
  testRuleWithTags: any
  testSqs: any
  testSqsToSfnPipe: any
  testSqsToLambdaPipe: any
  testSubmitStepCreateSomething: any
  testSubmitStepSuccess: any
  testSubmitWorkflow: any
  testTask: any
  testTable: any
  testVpc: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/dynamodb.json',
    'packages/aws/test/common/cdkConfig/ecs.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/logs.json',
    'packages/aws/test/common/cdkConfig/pipes.json',
    'packages/aws/test/common/cdkConfig/rules.json',
    'packages/aws/test/common/cdkConfig/sqs.json',
    'packages/aws/test/common/cdkConfig/stepFunctions.json',
    'packages/aws/test/common/cdkConfig/vpc.json',
  ],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
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
      testCluster: this.node.tryGetContext('testCluster'),
      testDynamoDbToLambdaPipe: this.node.tryGetContext('testDynamoDbToLambdaPipe'),
      testFargateRule: this.node.tryGetContext('testFargateRule'),
      testLambda: this.node.tryGetContext('testLambda'),
      testLambdaRule: this.node.tryGetContext('testLambdaRule'),
      testLambdaRuleWithTags: this.node.tryGetContext('testLambdaRuleWithTags'),
      testLambdaRuleWithSchedule: this.node.tryGetContext('testLambdaRuleWithSchedule'),
      testLambdaRuleWithInput: this.node.tryGetContext('testLambdaRuleWithInput'),
      testLogGroup: this.node.tryGetContext('testLogGroup'),
      testRule: this.node.tryGetContext('testRule'),
      testRuleWithTags: this.node.tryGetContext('testRuleWithTags'),
      testSqs: this.node.tryGetContext('testSqs'),
      testSqsToLambdaPipe: this.node.tryGetContext('testSqsToLambdaPipe'),
      testSqsToSfnPipe: this.node.tryGetContext('testSqsToSfnPipe'),
      testSubmitStepCreateSomething: this.node.tryGetContext('testSubmitStepCreateSomething'),
      testSubmitStepSuccess: this.node.tryGetContext('testSubmitStepSuccess'),
      testSubmitWorkflow: this.node.tryGetContext('testSubmitWorkflow'),
      testTable: this.node.tryGetContext('testTable'),
      testTask: this.node.tryGetContext('testTask'),
      testVpc: this.node.tryGetContext('testVpc'),
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
      testCluster: this.node.tryGetContext('testCluster'),
      testDynamoDbToLambdaPipe: this.node.tryGetContext('testDynamoDbToLambdaPipe'),
      testLambda: this.node.tryGetContext('testLambda'),
      testLogGroup: this.node.tryGetContext('testLogGroup'),
      testSqs: this.node.tryGetContext('testSqs'),
      testSqsToSfnPipe: this.node.tryGetContext('testSqsToSfnPipe'),
      testSubmitStepCreateSomething: this.node.tryGetContext('testSubmitStepCreateSomething'),
      testSubmitStepSuccess: this.node.tryGetContext('testSubmitStepSuccess'),
      testSubmitWorkflow: this.node.tryGetContext('testSubmitWorkflow'),
      testTable: this.node.tryGetContext('testTable'),
      testTask: this.node.tryGetContext('testTask'),
      testVpc: this.node.tryGetContext('testVpc'),
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testVpc = this.vpcManager.createCommonVpc(`${name}-vpc`, this, this.props.testVpc)
    const testCluster = this.ecsManager.createEcsCluster('test-cluster', this, this.props.testCluster, testVpc)
    const testImage = ecs.ContainerImage.fromAsset('packages/aws/test/common/docker')
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
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
    )
    this.eventManager.createLambdaRule('test-lambda-rule', this, this.props.testLambdaRule, testLambda)

    this.eventManager.createLambdaRule('test-lambda-rule-tags', this, this.props.testLambdaRuleWithTags, testLambda)

    this.eventManager.createLambdaRule(
      'test-lambda-rule-schedule',
      this,
      this.props.testLambdaRuleWithSchedule,
      testLambda,
      undefined,
      undefined,
      'rate(5 minutes)'
    )

    this.eventManager.createLambdaRule('test-lambda-rule-input', this, this.props.testLambdaRuleWithInput, testLambda)

    const testEventBus = this.eventManager.createEventBus('test-event-bus', this, {
      eventBusName: 'test-bus',
    })

    this.eventManager.createRule('test-rule', this, this.props.testRule, testEventBus)

    this.eventManager.createRule('test-rule-with-tags', this, this.props.testRuleWithTags)

    const testTable = this.dynamodbManager.createTable('test-table', this, this.props.testTable)

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
    this.eventManager.createSqsToLambdaCfnPipe(
      'test-sqs-to-lambda-pipe',
      this,
      this.props.testSqsToLambdaPipe,
      testQueue,
      testLambda
    )
    this.eventManager.createDynamoDbToLambdaCfnPipe(
      'test-dynamoDb-to-lambda-pipe',
      this,
      this.props.testDynamoDbToLambdaPipe,
      testTable.tableStreamArn!,
      testLambda
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
    template.resourceCountIs('AWS::DynamoDB::Table', 1)
    template.resourceCountIs('AWS::Events::Rule', 7)
    template.resourceCountIs('AWS::Events::EventBus', 1)
    template.resourceCountIs('AWS::Lambda::Permission', 4)
    template.resourceCountIs('AWS::SQS::Queue', 1)
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1)
    template.resourceCountIs('AWS::Pipes::Pipe', 3)
  })
})

describe('TestEventConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testFargateRuleRuleArn', {})
    template.hasOutput('testFargateRuleRuleName', {})
    template.hasOutput('testLambdaRuleRuleArn', {})
    template.hasOutput('testLambdaRuleRuleName', {})
    template.hasOutput('testEventBusEventBusName', {})
    template.hasOutput('testEventBusEventBusArn', {})
    template.hasOutput('testRuleRuleArn', {})
    template.hasOutput('testRuleRuleName', {})
    template.hasOutput('testRuleWithTagsRuleArn', {})
    template.hasOutput('testRuleWithTagsRuleName', {})
    template.hasOutput('testSqsQueueArn', {})
    template.hasOutput('testSqsQueueName', {})
    template.hasOutput('testSqsQueueUrl', {})
    template.hasOutput('testParallelStepStateMachineName', {})
    template.hasOutput('testParallelStepStateMachineArn', {})
    template.hasOutput('testSqsToSfnPipeRoleArn', {})
    template.hasOutput('testSqsToSfnPipeRoleName', {})
    template.hasOutput('testSqsToSfnPipePipeArn', {})
    template.hasOutput('testSqsToSfnPipePipeName', {})
    template.hasOutput('testSqsToLambdaPipeRoleArn', {})
    template.hasOutput('testSqsToLambdaPipeRoleName', {})
    template.hasOutput('testSqsToLambdaPipePipeArn', {})
    template.hasOutput('testSqsToLambdaPipePipeName', {})
    template.hasOutput('testDynamoDbToLambdaPipeRoleArn', {})
    template.hasOutput('testDynamoDbToLambdaPipeRoleName', {})
    template.hasOutput('testDynamoDbToLambdaPipePipeArn', {})
    template.hasOutput('testDynamoDbToLambdaPipePipeName', {})
    template.hasOutput('testLambdaRuleTagsRuleArn', {})
    template.hasOutput('testLambdaRuleTagsRuleName', {})
    template.hasOutput('testLambdaRuleScheduleRuleArn', {})
    template.hasOutput('testLambdaRuleScheduleRuleName', {})
    template.hasOutput('testLambdaRuleInputRuleArn', {})
    template.hasOutput('testLambdaRuleInputRuleName', {})
  })
})

describe('TestEventConstruct', () => {
  test('provisions new fargate event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Rule to send notification on new objects in data bucket to ecs task target',
      Name: 'cdktest-test-fargate-rule-test',
      State: 'ENABLED',
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
            TaskDefinitionArn: { Ref: 'testcommonstacktesttask23AF6E18' },
          },
          Id: 'cdktest-test-fargate-rule-test',
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
      Name: 'cdktest-test-lambda-rule-test',
      State: 'DISABLED',
      Targets: [
        {
          Arn: { 'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'] },
          Id: 'cdktest-test-lambda-rule-test',
        },
      ],
    })
  })

  test('provisions lambda rule with schedule expression as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Rule to send notification to lambda function target',
      Name: 'cdktest-test-lambda-rule-schedule-test',
      ScheduleExpression: 'rate(5 minutes)',
    })
  })

  test('provisions lambda rule with input as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Rule to send notification to lambda function target',
      Name: 'cdktest-test-lambda-rule-input-test',
      Targets: [
        {
          Input: '{"key":"value"}',
        },
      ],
    })
  })
})

describe('TestEventConstructEventBus', () => {
  test('provisions event bus as expected', () => {
    template.hasResourceProperties('AWS::Events::EventBus', {
      Name: 'cdktest-test-bus-test',
    })
  })

  test('provisions rule with event pattern as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        'detail-type': ['TestTagged'],
      },
      Name: 'cdktest-test-rule-with-tags-test',
    })
  })
})

describe('TestEventConstruct', () => {
  test('provisions new eventbridge pipe as expected', () => {
    template.hasResourceProperties('AWS::Pipes::Pipe', {
      Name: 'cdktest-test-dynamoDb-to-lambda-pipe-test',
      RoleArn: {
        'Fn::GetAtt': ['testcommonstacktestdynamoDbtolambdapiperoleCDE774CB', 'Arn'],
      },
      Source: {
        'Fn::GetAtt': ['testcommonstacktesttableF9EEAE8E', 'StreamArn'],
      },
      SourceParameters: {
        FilterCriteria: {
          Filters: [
            {
              Pattern: '{"detail":{"type":["testType"]}}',
            },
          ],
        },
      },
      Target: {
        'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
      },
    })
  })
})

describe('TestEventConstruct', () => {
  test('provisions new eventbridge pipe as expected', () => {
    template.hasResourceProperties('AWS::Pipes::Pipe', {
      Name: 'cdktest-test-sqs-to-sfn-pipe-test',
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

describe('TestEventConstruct', () => {
  test('provisions new eventbridge pipe as expected', () => {
    template.hasResourceProperties('AWS::Pipes::Pipe', {
      Name: 'cdktest-test-sqs-to-lambda-pipe-test',
      RoleArn: {
        'Fn::GetAtt': ['testcommonstacktestsqstolambdapiperole7FBE9459', 'Arn'],
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
        'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
      },
    })
  })
})

describe('TestEventConstructErrorHandling', () => {
  test('throws error when event bus props are undefined', () => {
    class TestErrorBusStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorBusConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorBusConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.eventManager.createEventBus('test-bus-err', this, undefined as any)
      }
    }

    const error = () => new TestErrorBusStack(app, 'test-error-stack-bus', testStackProps)
    expect(error).toThrow('EventBus props undefined')
  })

  test('throws error when event bus name is undefined', () => {
    class TestErrorBusNameStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorBusNameConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorBusNameConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.eventManager.createEventBus('test-bus-name-err', this, { eventBusName: undefined } as any)
      }
    }

    const error = () => new TestErrorBusNameStack(app, 'test-error-stack-bus-name', testStackProps)
    expect(error).toThrow('EventBus eventBusName undefined')
  })

  test('throws error when rule props are undefined', () => {
    class TestErrorRuleStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorRuleConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorRuleConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.eventManager.createRule('test-rule-err', this, undefined as any)
      }
    }

    const error = () => new TestErrorRuleStack(app, 'test-error-stack-rule', testStackProps)
    expect(error).toThrow('EventRule props undefined')
  })

  test('throws error when rule name is undefined', () => {
    class TestErrorRuleNameStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorRuleNameConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
        }
      }
    }

    class TestErrorRuleNameConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        this.eventManager.createRule('test-rule-name-err', this, { enabled: true } as any)
      }
    }

    const error = () => new TestErrorRuleNameStack(app, 'test-error-stack-rule-name', testStackProps)
    expect(error).toThrow('EventRule ruleName undefined')
  })

  test('throws error when lambda rule name is undefined', () => {
    class TestErrorLambdaRuleNameStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorLambdaRuleNameConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          testLambda: this.node.tryGetContext('testLambda'),
          testCluster: this.node.tryGetContext('testCluster'),
          testLogGroup: this.node.tryGetContext('testLogGroup'),
          testVpc: this.node.tryGetContext('testVpc'),
        }
      }
    }

    class TestErrorLambdaRuleNameConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        const testPolicy = new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
        const testRole = this.iamManager.createRoleForEcsExecution('test-role-lr-err', this, testPolicy)
        const testLambda = this.lambdaManager.createLambdaFunction(
          'test-lambda-lr-err',
          this,
          this.props.testLambda,
          testRole,
          [],
          new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
        )
        this.eventManager.createLambdaRule('test-lr-name-err', this, { state: 'ENABLED' } as any, testLambda)
      }
    }

    const error = () => new TestErrorLambdaRuleNameStack(app, 'test-error-stack-lr-name', testStackProps)
    expect(error).toThrow('EventRule name undefined')
  })

  test('throws error when fargate rule name is undefined', () => {
    class TestErrorFargateRuleNameStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorFargateRuleNameConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          testCluster: this.node.tryGetContext('testCluster'),
          testLogGroup: this.node.tryGetContext('testLogGroup'),
          testTask: this.node.tryGetContext('testTask'),
          testVpc: this.node.tryGetContext('testVpc'),
        }
      }
    }

    class TestErrorFargateRuleNameConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        const testVpc = this.vpcManager.createCommonVpc(`${name}-vpc`, this, this.props.testVpc)
        const testCluster = this.ecsManager.createEcsCluster(
          'test-cluster-fr-err',
          this,
          this.props.testCluster,
          testVpc
        )
        const testImage = ecs.ContainerImage.fromAsset('packages/aws/test/common/docker')
        const testLogGroup = this.logManager.createLogGroup('test-log-group-fr-err', this, this.props.testLogGroup)
        const testPolicy = new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
        const testRole = this.iamManager.createRoleForEcsExecution('test-role-fr-err', this, testPolicy)
        const testTask = this.ecsManager.createEcsFargateTask(
          'test-task-fr-err',
          this,
          this.props.testTask,
          testCluster,
          testRole,
          testLogGroup,
          testImage
        )
        const testRoleForEvent = this.iamManager.createRoleForEcsEvent(
          'test-ecs-role-fr-err',
          this,
          testCluster,
          testTask
        )
        this.eventManager.createFargateTaskRule(
          'test-fr-name-err',
          this,
          { state: 'ENABLED' } as any,
          testCluster,
          testTask,
          [],
          testRoleForEvent
        )
      }
    }

    const error = () => new TestErrorFargateRuleNameStack(app, 'test-error-stack-fr-name', testStackProps)
    expect(error).toThrow('EventRule name undefined')
  })

  test('throws error when pipe props are undefined for sqs to sfn', () => {
    class TestErrorPipeStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorPipeConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          testSqs: this.node.tryGetContext('testSqs'),
          testLambda: this.node.tryGetContext('testLambda'),
          testLogGroup: this.node.tryGetContext('testLogGroup'),
          testSubmitStepCreateSomething: this.node.tryGetContext('testSubmitStepCreateSomething'),
          testSubmitStepSuccess: this.node.tryGetContext('testSubmitStepSuccess'),
          testSubmitWorkflow: this.node.tryGetContext('testSubmitWorkflow'),
        }
      }
    }

    class TestErrorPipeConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        const testPolicy = new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
        const testRole = this.iamManager.createRoleForEcsExecution('test-role-pipe-err', this, testPolicy)
        const testLambda = this.lambdaManager.createLambdaFunction(
          'test-lambda-pipe-err',
          this,
          this.props.testLambda,
          testRole,
          [],
          new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
        )
        const testQueue = this.sqsManager.createQueue('test-sqs-pipe-err', this, this.props.testSqs)
        const testLogGroup = this.logManager.createLogGroup('test-log-group-pipe-err', this, this.props.testLogGroup)
        const testStep = this.sfnManager.createLambdaStep(
          'test-step-pipe-err',
          this,
          this.props.testSubmitStepCreateSomething,
          testLambda
        )
        const testSuccess = this.sfnManager.createSuccessStep(
          'test-pass-pipe-err',
          this,
          this.props.testSubmitStepSuccess
        )
        const testWorkflow = sfn.Chain.start(testStep).next(testSuccess)
        const testStateMachine = this.sfnManager.createStateMachine(
          'test-sm-pipe-err',
          this,
          this.props.testSubmitWorkflow,
          testWorkflow,
          testLogGroup
        )
        this.eventManager.createSqsToSfnCfnPipe('test-pipe-err', this, undefined as any, testQueue, testStateMachine)
      }
    }

    const error = () => new TestErrorPipeStack(app, 'test-error-stack-pipe', testStackProps)
    expect(error).toThrow('Pipe props undefined')
  })

  test('throws error when pipe name is undefined for sqs to lambda', () => {
    class TestErrorPipeNameStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorPipeNameConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          testSqs: this.node.tryGetContext('testSqs'),
          testLambda: this.node.tryGetContext('testLambda'),
        }
      }
    }

    class TestErrorPipeNameConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        const testPolicy = new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
        const testRole = this.iamManager.createRoleForEcsExecution('test-role-pn-err', this, testPolicy)
        const testLambda = this.lambdaManager.createLambdaFunction(
          'test-lambda-pn-err',
          this,
          this.props.testLambda,
          testRole,
          [],
          new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
        )
        const testQueue = this.sqsManager.createQueue('test-sqs-pn-err', this, this.props.testSqs)
        this.eventManager.createSqsToLambdaCfnPipe(
          'test-pipe-name-err',
          this,
          { sqsBatchSize: 10 } as any,
          testQueue,
          testLambda
        )
      }
    }

    const error = () => new TestErrorPipeNameStack(app, 'test-error-stack-pipe-name', testStackProps)
    expect(error).toThrow('Pipe name undefined')
  })

  test('throws error when dynamodb pipe props are undefined', () => {
    class TestErrorDdbPipeStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestErrorDdbPipeConstruct(this, testStackProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          testLambda: this.node.tryGetContext('testLambda'),
        }
      }
    }

    class TestErrorDdbPipeConstruct extends CommonConstruct {
      declare props: TestStackProps

      constructor(parent: Construct, name: string, props: TestStackProps) {
        super(parent, name, props)
        const testPolicy = new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
        const testRole = this.iamManager.createRoleForEcsExecution('test-role-ddb-err', this, testPolicy)
        const testLambda = this.lambdaManager.createLambdaFunction(
          'test-lambda-ddb-err',
          this,
          this.props.testLambda,
          testRole,
          [],
          new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
        )
        this.eventManager.createDynamoDbToLambdaCfnPipe(
          'test-ddb-pipe-err',
          this,
          undefined as any,
          'arn:aws:dynamodb:eu-west-1:123456789:table/test/stream/123',
          testLambda
        )
      }
    }

    const error = () => new TestErrorDdbPipeStack(app, 'test-error-stack-ddb-pipe', testStackProps)
    expect(error).toThrow('Pipe props undefined')
  })
})
