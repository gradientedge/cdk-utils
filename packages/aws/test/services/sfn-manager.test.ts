import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps, TableProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testAnotherLogGroup: any
  testLambda: any
  testSecondSubmitWorkflow: any
  testSfnExecution: any
  testSqs: any
  testSubmitStepApi: any
  testSubmitStepCreateSomething: any
  testSubmitStepSkippableLambda: any
  testSubmitStepCreateSomethingElse: any
  testSubmitStepCreateSomethingNew: any
  testSubmitStepCreateSomethingParallel: any
  testSubmitStepDeleteItem: any
  testSubmitStepFailure: any
  testSubmitStepGetItem: any
  testSubmitStepPutItem: any
  testSubmitStepSendMessage: any
  testSubmitStepSuccess: any
  testSubmitStepValidateSomething: any
  testSubmitStepWait: any
  testSubmitWorkflow: any
  testTable: TableProps
}

interface TestBranchCoverageStackProps extends CommonStackProps {
  testAnotherLogGroup: any
  testBranchCoverageWorkflow: any
  testLambda: any
  testSqs: any
  testSubmitStepApi: any
  testSubmitStepApiWithCustomRetries: any
  testSubmitStepCreateSomething: any
  testSubmitStepDeleteItemWithCustomRetries: any
  testSubmitStepFailure: any
  testSubmitStepGetItemWithCustomRetries: any
  testSubmitStepLambdaWithCustomRetries: any
  testSubmitStepLambdaWithEmptyRetries: any
  testSubmitStepPutItemWithEmptyRetries: any
  testSubmitStepSendMessageWithCustomRetries: any
  testSubmitStepSfnExecutionWithCustomRetries: any
  testSubmitStepSkippableLambdaNoSkip: any
  testSubmitStepSkippableLambdaUndefinedSkip: any
  testSubmitStepSuccess: any
  testSubmitWorkflow: any
  testTable: TableProps
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/dynamodb.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/logs.json',
    'packages/aws/test/common/cdkConfig/sqs.json',
    'packages/aws/test/common/cdkConfig/stepFunctions.json',
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
      ...{
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
        testLambda: this.node.tryGetContext('testLambda'),
        testSecondSubmitWorkflow: this.node.tryGetContext('testSecondSubmitWorkflow'),
        testSfnExecution: this.node.tryGetContext('testSfnExecution'),
        testSqs: this.node.tryGetContext('testSqs'),
        testSubmitStepApi: this.node.tryGetContext('testSubmitStepApi'),
        testSubmitStepCreateSomething: this.node.tryGetContext('testSubmitStepCreateSomething'),
        testSubmitStepCreateSomethingElse: this.node.tryGetContext('testSubmitStepCreateSomethingElse'),
        testSubmitStepCreateSomethingNew: this.node.tryGetContext('testSubmitStepCreateSomethingNew'),
        testSubmitStepCreateSomethingParallel: this.node.tryGetContext('testSubmitStepCreateSomethingParallel'),
        testSubmitStepDeleteItem: this.node.tryGetContext('testSubmitStepDeleteItem'),
        testSubmitStepFailure: this.node.tryGetContext('testSubmitStepFailure'),
        testSubmitStepGetItem: this.node.tryGetContext('testSubmitStepGetItem'),
        testSubmitStepPutItem: this.node.tryGetContext('testSubmitStepPutItem'),
        testSubmitStepSendMessage: this.node.tryGetContext('testSubmitStepSendMessage'),
        testSubmitStepSkippableLambda: this.node.tryGetContext('testSubmitStepSkippableLambda'),
        testSubmitStepSuccess: this.node.tryGetContext('testSubmitStepSuccess'),
        testSubmitStepValidateSomething: this.node.tryGetContext('testSubmitStepValidateSomething'),
        testSubmitStepWait: this.node.tryGetContext('testSubmitStepWait'),
        testSubmitWorkflow: this.node.tryGetContext('testSubmitWorkflow'),
        testTable: this.node.tryGetContext('testTable'),
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
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
        testLambda: this.node.tryGetContext('testLambda'),
        testSqs: this.node.tryGetContext('testSqs'),
        testSubmitStepSendMessage: this.node.tryGetContext('testSubmitStepSendMessage'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testLayer = this.lambdaManager.createLambdaLayer(
      'test-lambda-layer',
      this,
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
    )
    const testRole = this.iamManager.createRoleForLambda(
      'test-role',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    )
    const testLambda = this.lambdaManager.createLambdaFunction(
      'test-lambda',
      this,
      this.props.testLambda,
      testRole,
      [testLayer],
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
    )

    const api = this.apiManager.createLambdaRestApi(
      'test-api',
      this,
      {
        defaultCorsPreflightOptions: {
          allowOrigins: apig.Cors.ALL_ORIGINS,
        },
        deploy: true,
        deployOptions: {
          description: `test - ${this.props.stage} stage`,
          stageName: this.props.stage,
        },
        endpointConfiguration: {
          types: [apig.EndpointType.REGIONAL],
        },
        handler: testLambda,
        proxy: false,
        restApiName: 'test-lambda-rest-api',
      },
      testLambda
    )

    const testLogGroup = this.logManager.createLogGroup('test-cfn-log', this, this.props.testAnotherLogGroup)

    const testSubmitStepSuccess = this.sfnManager.createSuccessStep(
      'test-pass-step',
      this,
      this.props.testSubmitStepSuccess
    )
    const testSubmitStepFailure = this.sfnManager.createFailStep(
      'test-fail-step',
      this,
      this.props.testSubmitStepFailure
    )
    const testSubmitStepValidateSomething = this.sfnManager.createChoiceStep(
      'test-choice-step',
      this,
      this.props.testSubmitStepValidateSomething
    )
    const testSubmitStepCreateSomething = this.sfnManager.createLambdaStep(
      'test-choice-step-2',
      this,
      this.props.testSubmitStepCreateSomething,
      testLambda
    )
    const testSkippableLambda = this.sfnManager.createSkippableLambdaStep(
      'test-choice-step-3',
      this,
      this.props.testSubmitStepSkippableLambda,
      testLambda,
      true
    )

    const testTable = this.dynamodbManager.createTable('test-table', this, this.props.testTable)
    const testSubmitStepGetItem = this.sfnManager.createDynamoDbGetItemStep(
      'test-ddb-get-item',
      this,
      this.props.testSubmitStepGetItem,
      testTable,
      { id: tasks.DynamoAttributeValue.fromString('test') }
    )

    const testSubmitStepPutItem = this.sfnManager.createDynamoDbPutItemStep(
      'test-ddb-put-item',
      this,
      this.props.testSubmitStepPutItem,
      testTable,
      { id: tasks.DynamoAttributeValue.fromString('test-put') }
    )

    const testSubmitStepDeleteItem = this.sfnManager.createDynamoDbDeleteItemStep(
      'test-ddb-put-item',
      this,
      this.props.testSubmitStepDeleteItem,
      testTable,
      { id: tasks.DynamoAttributeValue.fromString('test-delete') }
    )

    const testSqs = this.sqsManager.createQueue('test-sqs', this, this.props.testSqs)
    const testSubmitStepSendMessage = this.sfnManager.createSendSqsMessageStep(
      'test-sqs-send-msg',
      this,
      this.props.testSubmitStepSendMessage,
      testSqs
    )

    const testSubmitStepCreateSomethingElse = this.sfnManager.createLambdaStep(
      'test-choice-step-2',
      this,
      this.props.testSubmitStepCreateSomethingElse,
      testLambda
    )
    const testSubmitStepCreateSomethingParallel = this.sfnManager.createParallelStep(
      'test-parallel-step',
      this,
      this.props.testSubmitStepCreateSomethingParallel
    )
    const testSubmitStepWait = this.sfnManager.createWaitStep('test-wait-step', this, this.props.testSubmitStepWait)
    const testSubmitStepCreateSomethingNew = this.sfnManager.createPassStep(
      'test-pass-step',
      this,
      this.props.testSubmitStepCreateSomethingNew
    )
    const testSubmitStepApi = this.sfnManager.createApiStep('test-api', this, this.props.testSubmitStepApi, api)
    const testWorkflowIntegration = sfn.Chain.start(testSubmitStepCreateSomething)
      .next(testSkippableLambda)
      .next(
        testSubmitStepValidateSomething
          .when(sfn.Condition.isNull('$.detail.id'), testSubmitStepFailure)
          .otherwise(testSubmitStepCreateSomethingElse)
          .afterwards()
      )
      .next(testSubmitStepWait)
      .next(
        testSubmitStepCreateSomethingParallel
          .branch(testSubmitStepCreateSomethingNew)
          .branch(testSubmitStepApi)
          .branch(testSubmitStepGetItem.next(testSubmitStepPutItem).next(testSubmitStepDeleteItem))
          .branch(testSubmitStepSendMessage)
          .addCatch(testSubmitStepFailure)
          .next(testSubmitStepSuccess)
      )
    const stateMachine = this.sfnManager.createStateMachine(
      'test-parallel-step',
      this,
      this.props.testSubmitWorkflow,
      testWorkflowIntegration,
      testLogGroup
    )

    const testSfnExecution = this.sfnManager.createSfnExecutionStep(
      'test-sfn-task',
      this,
      this.props.testSfnExecution,
      stateMachine
    )
    const testSecondWorkflowIntegration = sfn.Chain.start(testSfnExecution)
    this.sfnManager.createStateMachine(
      'test-second-sfn',
      this,
      this.props.testSecondSubmitWorkflow,
      testSecondWorkflowIntegration,
      testLogGroup
    )
  }
}

class TestBranchCoverageStack extends CommonStack {
  declare props: TestBranchCoverageStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestBranchCoverageConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
        testBranchCoverageWorkflow: this.node.tryGetContext('testBranchCoverageWorkflow'),
        testLambda: this.node.tryGetContext('testLambda'),
        testSqs: this.node.tryGetContext('testSqs'),
        testSubmitStepApi: this.node.tryGetContext('testSubmitStepApi'),
        testSubmitStepApiWithCustomRetries: this.node.tryGetContext('testSubmitStepApiWithCustomRetries'),
        testSubmitStepCreateSomething: this.node.tryGetContext('testSubmitStepCreateSomething'),
        testSubmitStepDeleteItemWithCustomRetries: this.node.tryGetContext('testSubmitStepDeleteItemWithCustomRetries'),
        testSubmitStepFailure: this.node.tryGetContext('testSubmitStepFailure'),
        testSubmitStepGetItemWithCustomRetries: this.node.tryGetContext('testSubmitStepGetItemWithCustomRetries'),
        testSubmitStepLambdaWithCustomRetries: this.node.tryGetContext('testSubmitStepLambdaWithCustomRetries'),
        testSubmitStepLambdaWithEmptyRetries: this.node.tryGetContext('testSubmitStepLambdaWithEmptyRetries'),
        testSubmitStepPutItemWithEmptyRetries: this.node.tryGetContext('testSubmitStepPutItemWithEmptyRetries'),
        testSubmitStepSendMessageWithCustomRetries: this.node.tryGetContext(
          'testSubmitStepSendMessageWithCustomRetries'
        ),
        testSubmitStepSfnExecutionWithCustomRetries: this.node.tryGetContext(
          'testSubmitStepSfnExecutionWithCustomRetries'
        ),
        testSubmitStepSkippableLambdaNoSkip: this.node.tryGetContext('testSubmitStepSkippableLambdaNoSkip'),
        testSubmitStepSkippableLambdaUndefinedSkip: this.node.tryGetContext(
          'testSubmitStepSkippableLambdaUndefinedSkip'
        ),
        testSubmitStepSuccess: this.node.tryGetContext('testSubmitStepSuccess'),
        testSubmitWorkflow: this.node.tryGetContext('testSubmitWorkflow'),
        testTable: this.node.tryGetContext('testTable'),
      },
    }
  }
}

class TestBranchCoverageConstruct extends CommonConstruct {
  declare props: TestBranchCoverageStackProps

  constructor(parent: Construct, name: string, props: TestBranchCoverageStackProps) {
    super(parent, name, props)
    const testLayer = this.lambdaManager.createLambdaLayer(
      'test-lambda-layer',
      this,
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
    )
    const testRole = this.iamManager.createRoleForLambda(
      'test-role',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    )
    const testLambda = this.lambdaManager.createLambdaFunction(
      'test-lambda',
      this,
      this.props.testLambda,
      testRole,
      [testLayer],
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
    )

    const api = this.apiManager.createLambdaRestApi(
      'test-api',
      this,
      {
        defaultCorsPreflightOptions: {
          allowOrigins: apig.Cors.ALL_ORIGINS,
        },
        deploy: true,
        deployOptions: {
          description: `test - ${this.props.stage} stage`,
          stageName: this.props.stage,
        },
        endpointConfiguration: {
          types: [apig.EndpointType.REGIONAL],
        },
        handler: testLambda,
        proxy: false,
        restApiName: 'test-lambda-rest-api',
      },
      testLambda
    )

    const testLogGroup = this.logManager.createLogGroup('test-cfn-log', this, this.props.testAnotherLogGroup)
    const testTable = this.dynamodbManager.createTable('test-table', this, this.props.testTable)
    const testSqs = this.sqsManager.createQueue('test-sqs', this, this.props.testSqs)

    /* Lambda step with custom retries */
    const lambdaWithCustomRetries = this.sfnManager.createLambdaStep(
      'test-lambda-custom-retries',
      this,
      this.props.testSubmitStepLambdaWithCustomRetries,
      testLambda
    )

    /* Lambda step with empty retries array - exercises DEFAULT_RETRY_CONFIG fallback */
    const lambdaWithEmptyRetries = this.sfnManager.createLambdaStep(
      'test-lambda-empty-retries',
      this,
      this.props.testSubmitStepLambdaWithEmptyRetries,
      testLambda
    )

    /* Skippable lambda step with skipExecution=false - exercises the LambdaInvoke branch */
    const skippableLambdaNoSkip = this.sfnManager.createSkippableLambdaStep(
      'test-skippable-no-skip',
      this,
      this.props.testSubmitStepSkippableLambdaNoSkip,
      testLambda,
      false
    )

    /* Skippable lambda step with skipExecution=undefined - exercises the LambdaInvoke branch */
    const skippableLambdaUndefinedSkip = this.sfnManager.createSkippableLambdaStep(
      'test-skippable-undefined-skip',
      this,
      this.props.testSubmitStepSkippableLambdaUndefinedSkip,
      testLambda
    )

    /* DynamoDB get item with custom retries */
    const getItemWithCustomRetries = this.sfnManager.createDynamoDbGetItemStep(
      'test-ddb-get-custom-retries',
      this,
      this.props.testSubmitStepGetItemWithCustomRetries,
      testTable,
      { id: tasks.DynamoAttributeValue.fromString('test-custom') }
    )

    /* DynamoDB put item with empty retries - exercises DEFAULT_RETRY_CONFIG fallback */
    const putItemWithEmptyRetries = this.sfnManager.createDynamoDbPutItemStep(
      'test-ddb-put-empty-retries',
      this,
      this.props.testSubmitStepPutItemWithEmptyRetries,
      testTable,
      { id: tasks.DynamoAttributeValue.fromString('test-put-empty') }
    )

    /* DynamoDB delete item with custom retries */
    const deleteItemWithCustomRetries = this.sfnManager.createDynamoDbDeleteItemStep(
      'test-ddb-delete-custom-retries',
      this,
      this.props.testSubmitStepDeleteItemWithCustomRetries,
      testTable,
      { id: tasks.DynamoAttributeValue.fromString('test-delete-custom') }
    )

    /* SQS send message with custom retries */
    const sendMessageWithCustomRetries = this.sfnManager.createSendSqsMessageStep(
      'test-sqs-custom-retries',
      this,
      this.props.testSubmitStepSendMessageWithCustomRetries,
      testSqs
    )

    /* API step with custom retries (no retries in config = default retries) */
    const apiWithCustomRetries = this.sfnManager.createApiStep(
      'test-api-custom-retries',
      this,
      this.props.testSubmitStepApiWithCustomRetries,
      api
    )

    const testSubmitStepSuccess = this.sfnManager.createSuccessStep(
      'test-success',
      this,
      this.props.testSubmitStepSuccess
    )
    const testSubmitStepFailure = this.sfnManager.createFailStep('test-failure', this, this.props.testSubmitStepFailure)

    const testWorkflowIntegration = sfn.Chain.start(lambdaWithCustomRetries)
      .next(lambdaWithEmptyRetries)
      .next(skippableLambdaNoSkip)
      .next(getItemWithCustomRetries)
      .next(putItemWithEmptyRetries)
      .next(deleteItemWithCustomRetries)
      .next(sendMessageWithCustomRetries)
      .next(apiWithCustomRetries)
      .next(testSubmitStepSuccess)

    const stateMachine = this.sfnManager.createStateMachine(
      'test-branch-coverage-sfn',
      this,
      this.props.testBranchCoverageWorkflow,
      testWorkflowIntegration,
      testLogGroup
    )

    /* SFN execution step with custom retries */
    const sfnExecutionWithCustomRetries = this.sfnManager.createSfnExecutionStep(
      'test-sfn-execution-custom-retries',
      this,
      this.props.testSubmitStepSfnExecutionWithCustomRetries,
      stateMachine
    )
    const secondWorkflow = sfn.Chain.start(sfnExecutionWithCustomRetries)
    this.sfnManager.createStateMachine(
      'test-branch-coverage-second-sfn',
      this,
      this.props.testSubmitWorkflow,
      secondWorkflow,
      testLogGroup
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

const branchCoverageApp = new cdk.App({ context: testStackProps })
const branchCoverageStack = new TestBranchCoverageStack(branchCoverageApp, 'test-branch-coverage-stack', testStackProps)
const branchCoverageTemplate = Template.fromStack(branchCoverageStack)

describe('TestSfnConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Step props undefined')
  })
})

describe('TestSfnConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Lambda::LayerVersion', 1)
    template.resourceCountIs('AWS::Lambda::Function', 1)
    template.resourceCountIs('AWS::IAM::Role', 3)
    template.resourceCountIs('AWS::IAM::Policy', 2)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Deployment', 1)
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 2)
    template.resourceCountIs('Custom::LogRetention', 0)
  })
})

describe('TestSfnConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testLambdaLayerLambdaLayerArn', {})
    template.hasOutput('testRoleArn', {})
    template.hasOutput('testRoleName', {})
    template.hasOutput('testLambdaLambdaArn', {})
    template.hasOutput('testLambdaLambdaName', {})
    template.hasOutput('testApiRestApiId', {})
    template.hasOutput('testApiRestApiName', {})
    template.hasOutput('testCfnLogLogGroupArn', {})
    template.hasOutput('testParallelStepStateMachineName', {})
    template.hasOutput('testParallelStepStateMachineArn', {})
  })
})

describe('TestSfnConstruct', () => {
  test('provisions new state machine as expected', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"step:Create Something","States":{"step:Create Something":{"Next":"step:Create Skippable Lambda","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2},{"ErrorEquals":["Lambda.TooManyRequestsException"],"IntervalSeconds":10,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"Lambda step for step:Create Something - test stage","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
            },
            '","Payload.$":"$"}},"step:Create Skippable Lambda":{"Type":"Pass","Comment":"Pass step for step:Create Skippable Lambda - test stage","Next":"step:Something Validated?"},"step:Something Validated?":{"Type":"Choice","Comment":"Choice step for step:Something Validated? - test stage","Choices":[{"Variable":"$.detail.id","IsNull":true,"Next":"workflow:Failed"}],"Default":"step:Create Something Else"},"step:Create Something Else":{"Next":"step:Wait","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2},{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"Lambda step for step:Create Something Else - test stage","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
            },
            '","Payload.$":"$"}},"step:Wait":{"Type":"Wait","Comment":"Choice step for step:Wait - test stage","Seconds":10,"Next":"parallel:Create Something"},"parallel:Create Something":{"Type":"Parallel","Comment":"Parallel step for parallel:Create Something - test stage","Next":"workflow:Complete","Catch":[{"ErrorEquals":["States.ALL"],"Next":"workflow:Failed"}],"Branches":[{"StartAt":"step:Create Something New","States":{"step:Create Something New":{"Type":"Pass","Comment":"Pass step for step:Create Something New - test stage","End":true}}},{"StartAt":"step:Call Some API","States":{"step:Call Some API":{"End":true,"Retry":[{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"API step for step:Call Some API - test stage","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::apigateway:invoke","Parameters":{"ApiEndpoint":"',
            {
              Ref: 'testcommonstacktestapiAF68926D',
            },
            '.execute-api.eu-west-1.',
            {
              Ref: 'AWS::URLSuffix',
            },
            '","Stage":"test","AuthType":"NO_AUTH"}}}},{"StartAt":"step:Get Item from dynamodb","States":{"step:Get Item from dynamodb":{"Next":"step:Put Item into dynamodb","Retry":[{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"DynamoDB GetItem step for step:Get Item from dynamodb - test stage","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::dynamodb:getItem","Parameters":{"Key":{"id":{"S":"test"}},"TableName":"',
            {
              Ref: 'testcommonstacktesttableF9EEAE8E',
            },
            '","ConsistentRead":false}},"step:Put Item into dynamodb":{"Next":"step:Delete Item from dynamodb","Retry":[{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"DynamoDB PutItem step for step:Put Item into dynamodb - test stage","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::dynamodb:putItem","Parameters":{"Item":{"id":{"S":"test-put"}},"TableName":"',
            {
              Ref: 'testcommonstacktesttableF9EEAE8E',
            },
            '"}},"step:Delete Item from dynamodb":{"End":true,"Retry":[{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"DynamoDB DeleteItem step for step:Delete Item from dynamodb - test stage","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::dynamodb:deleteItem","Parameters":{"Key":{"id":{"S":"test-delete"}},"TableName":"',
            {
              Ref: 'testcommonstacktesttableF9EEAE8E',
            },
            '"}}}},{"StartAt":"step:Send message to SQS","States":{"step:Send message to SQS":{"End":true,"Retry":[{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"DynamoDB PutItem step for step:Send message to SQS - test stage","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::sqs:sendMessage","Parameters":{"QueueUrl":"',
            {
              Ref: 'testcommonstacktestsqs99C34404',
            },
            '","MessageGroupId":"test"}}}}]},"workflow:Complete":{"Type":"Succeed","Comment":"Succeed step for workflow:Complete - test stage"},"workflow:Failed":{"Type":"Fail","Comment":"Fail step for workflow:Failed - test stage"}}}',
          ],
        ],
      },
      LoggingConfiguration: {
        Destinations: [
          {
            CloudWatchLogsLogGroup: {
              LogGroupArn: {
                'Fn::GetAtt': ['testcommonstacktestcfnlog5E1E2001', 'Arn'],
              },
            },
          },
        ],
        IncludeExecutionData: true,
        Level: 'ALL',
      },
      RoleArn: {
        'Fn::GetAtt': ['testcommonstacktestparallelstepRole68F267C5', 'Arn'],
      },
      StateMachineName: 'cdktest-test-workflow-test',
      StateMachineType: 'STANDARD',
    })
  })
})

describe('TestSfnConstruct', () => {
  test('provisions new state machine with sfn execution as expected', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"test-sfn-task","States":{"test-sfn-task":{"End":true,"Retry":[{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::states:startExecution","Parameters":{"Input":{"AWS_STEP_FUNCTIONS_STARTED_BY_EXECUTION_ID.$":"$$.Execution.Id"},"StateMachineArn":"',
            {
              Ref: 'testcommonstacktestparallelstep535C7CF2',
            },
            '","Name":"test-sfn-execution-task"}}}}',
          ],
        ],
      },
      LoggingConfiguration: {
        Destinations: [
          {
            CloudWatchLogsLogGroup: {
              LogGroupArn: {
                'Fn::GetAtt': ['testcommonstacktestcfnlog5E1E2001', 'Arn'],
              },
            },
          },
        ],
        IncludeExecutionData: true,
        Level: 'ALL',
      },
      RoleArn: {
        'Fn::GetAtt': ['testcommonstacktestsecondsfnRole66E6DE7B', 'Arn'],
      },
      StateMachineName: 'cdktest-test-second-workflow-test',
      StateMachineType: 'STANDARD',
    })
  })
})

describe('TestSfnConstruct - Branch Coverage', () => {
  test('synthesises branch coverage stack as expected', () => {
    branchCoverageTemplate.resourceCountIs('AWS::StepFunctions::StateMachine', 2)
    branchCoverageTemplate.resourceCountIs('AWS::Lambda::Function', 1)
    branchCoverageTemplate.resourceCountIs('AWS::DynamoDB::Table', 1)
    branchCoverageTemplate.resourceCountIs('AWS::SQS::Queue', 1)
  })

  test('lambda step with custom retries uses provided retry configuration', () => {
    branchCoverageTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      StateMachineName: 'cdktest-test-branch-coverage-workflow-test',
    })
  })

  test('provisions branch coverage state machine with custom and default retry paths', () => {
    const resources = branchCoverageTemplate.findResources('AWS::StepFunctions::StateMachine', {
      Properties: {
        StateMachineName: 'cdktest-test-branch-coverage-workflow-test',
      },
    })

    const resourceKeys = Object.keys(resources)
    expect(resourceKeys.length).toBe(1)

    const stateMachine = resources[resourceKeys[0]]
    const definitionParts = stateMachine.Properties.DefinitionString['Fn::Join'][1]

    /* Verify the definition string contains expected step names */
    const definitionStr = definitionParts.filter((part: any) => typeof part === 'string').join('')

    /* Lambda step with custom retries should have custom retry config */
    expect(definitionStr).toContain('step:Lambda With Custom Retries')
    expect(definitionStr).toContain('"ErrorEquals":["States.TaskFailed"]')
    expect(definitionStr).toContain('"IntervalSeconds":5')
    expect(definitionStr).toContain('"MaxAttempts":3')
    expect(definitionStr).toContain('"BackoffRate":3')

    /* Lambda step with empty retries should fall back to DEFAULT_RETRY_CONFIG */
    expect(definitionStr).toContain('step:Lambda With Empty Retries')
    expect(definitionStr).toContain('"ErrorEquals":["States.ALL"]')
    expect(definitionStr).toContain('"IntervalSeconds":30')
    expect(definitionStr).toContain('"MaxAttempts":6')

    /* Skippable lambda with skipExecution=false should be a Task (LambdaInvoke), not a Pass */
    expect(definitionStr).toContain('"step:Skippable Lambda No Skip":{"Next":')
    expect(definitionStr).toContain('Lambda step for step:Skippable Lambda No Skip')

    /* DynamoDB get item with custom retries */
    expect(definitionStr).toContain('step:Get Item Custom Retries')
    expect(definitionStr).toContain('"IntervalSeconds":10')

    /* DynamoDB put item with empty retries should use default */
    expect(definitionStr).toContain('step:Put Item Empty Retries')

    /* DynamoDB delete item with custom retries */
    expect(definitionStr).toContain('step:Delete Item Custom Retries')

    /* SQS send message with custom retries */
    expect(definitionStr).toContain('step:Send Message Custom Retries')
    expect(definitionStr).toContain('"IntervalSeconds":20')
    expect(definitionStr).toContain('"MaxAttempts":5')

    /* API step with default retries (no retries in config) */
    expect(definitionStr).toContain('step:API With Custom Retries')
  })

  test('sfn execution step with custom retries uses provided retry configuration', () => {
    const resources = branchCoverageTemplate.findResources('AWS::StepFunctions::StateMachine', {
      Properties: {
        StateMachineName: 'cdktest-test-workflow-test',
      },
    })

    const resourceKeys = Object.keys(resources)
    expect(resourceKeys.length).toBe(1)

    const stateMachine = resources[resourceKeys[0]]
    const definitionParts = stateMachine.Properties.DefinitionString['Fn::Join'][1]
    const definitionStr = definitionParts.filter((part: any) => typeof part === 'string').join('')

    /* SFN execution step with custom retries */
    expect(definitionStr).toContain('test-sfn-execution-custom-retries')
    expect(definitionStr).toContain('"ErrorEquals":["States.TaskFailed"]')
    expect(definitionStr).toContain('"IntervalSeconds":10')
    expect(definitionStr).toContain('"MaxAttempts":3')
  })
})
