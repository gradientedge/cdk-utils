import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import * as types from '../../lib/types'

interface TestStackProps extends types.CommonStackProps {
  testLambda: any
  testSubmitStepSuccess: any
  testSubmitStepFailure: any
  testSubmitStepValidateSomething: any
  testSubmitStepCreateSomething: any
  testSubmitStepCreateSomethingElse: any
  testSubmitStepCreateSomethingParallel: any
  testSubmitStepCreateSomethingNew: any
  testSubmitStepGetItem: any
  testSubmitStepPutItem: any
  testSubmitStepDeleteItem: any
  testSubmitStepSendMessage: any
  testSubmitStepApi: any
  testSubmitStepWait: any
  testSubmitWorkflow: any
  testAnotherLogGroup: any
  testTable: types.TableProps
  testSqs: any
}

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
  extraContexts: [
    'src/test/common/cdkConfig/dynamodb.json',
    'src/test/common/cdkConfig/lambdas.json',
    'src/test/common/cdkConfig/logs.json',
    'src/test/common/cdkConfig/sqs.json',
    'src/test/common/cdkConfig/stepFunctions.json',
  ],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends common.CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testLambda: this.node.tryGetContext('testLambda'),
        testSubmitStepSuccess: this.node.tryGetContext('testSubmitStepSuccess'),
        testSubmitStepFailure: this.node.tryGetContext('testSubmitStepFailure'),
        testSubmitStepValidateSomething: this.node.tryGetContext('testSubmitStepValidateSomething'),
        testSubmitStepCreateSomething: this.node.tryGetContext('testSubmitStepCreateSomething'),
        testSubmitStepCreateSomethingElse: this.node.tryGetContext('testSubmitStepCreateSomethingElse'),
        testSubmitStepCreateSomethingParallel: this.node.tryGetContext('testSubmitStepCreateSomethingParallel'),
        testSubmitStepCreateSomethingNew: this.node.tryGetContext('testSubmitStepCreateSomethingNew'),
        testSubmitStepGetItem: this.node.tryGetContext('testSubmitStepGetItem'),
        testSubmitStepPutItem: this.node.tryGetContext('testSubmitStepPutItem'),
        testSubmitStepDeleteItem: this.node.tryGetContext('testSubmitStepDeleteItem'),
        testSubmitStepSendMessage: this.node.tryGetContext('testSubmitStepSendMessage'),
        testSubmitStepApi: this.node.tryGetContext('testSubmitStepApi'),
        testSubmitStepWait: this.node.tryGetContext('testSubmitStepWait'),
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
        testSubmitWorkflow: this.node.tryGetContext('testSubmitWorkflow'),
        testTable: this.node.tryGetContext('testTable'),
        testSqs: this.node.tryGetContext('testSqs'),
      },
    }
  }
}

class TestInvalidCommonStack extends common.CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testLambda: this.node.tryGetContext('testLambda'),
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
        testSqs: this.node.tryGetContext('testSqs'),
        testSubmitStepSendMessage: this.node.tryGetContext('testSubmitStepSendMessage'),
      },
    }
  }
}

class TestCommonConstruct extends common.CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testLayer = this.lambdaManager.createLambdaLayer(
      'test-lambda-layer',
      this,
      new lambda.AssetCode('src/test/common/nodejs/lib')
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
      new lambda.AssetCode('src/test/common/nodejs/lib')
    )

    const api = this.apiManager.createLambdaRestApi(
      'test-api',
      this,
      {
        deploy: true,
        restApiName: 'test-lambda-rest-api',
        deployOptions: {
          description: `test - ${this.props.stage} stage`,
          stageName: this.props.stage,
        },
        endpointConfiguration: {
          types: [apig.EndpointType.REGIONAL],
        },
        handler: testLambda,
        defaultCorsPreflightOptions: {
          allowOrigins: apig.Cors.ALL_ORIGINS,
        },
        proxy: false,
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
    this.sfnManager.createStateMachine(
      'test-parallel-step',
      this,
      this.props.testSubmitWorkflow,
      testWorkflowIntegration,
      testLogGroup
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

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
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('AWS::IAM::Role', 3)
    template.resourceCountIs('AWS::IAM::Policy', 2)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Deployment', 1)
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1)
    template.resourceCountIs('Custom::LogRetention', 1)
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
      RoleArn: {
        'Fn::GetAtt': ['testcommonstacktestparallelstepRole68F267C5', 'Arn'],
      },
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"step:Create Something","States":{"step:Create Something":{"Next":"step:Something Validated?","Retry":[{"ErrorEquals":["Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2},{"ErrorEquals":["Lambda.TooManyRequestsException"],"IntervalSeconds":10,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"Lambda step for step:Create Something - test stage","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
            },
            '","Payload.$":"$"}},"step:Something Validated?":{"Type":"Choice","Comment":"Choice step for step:Something Validated? - test stage","Choices":[{"Variable":"$.detail.id","IsNull":true,"Next":"workflow:Failed"}],"Default":"step:Create Something Else"},"step:Create Something Else":{"Next":"step:Wait","Retry":[{"ErrorEquals":["Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2},{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"Lambda step for step:Create Something Else - test stage","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
            },
            '","Payload.$":"$"}},"step:Wait":{"Type":"Wait","Comment":"Choice step for step:Wait - test stage","Seconds":10,"Next":"parallel:Create Something"},"parallel:Create Something":{"Type":"Parallel","Comment":"Parallel step for parallel:Create Something - test stage","Next":"workflow:Complete","Retry":[{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Catch":[{"ErrorEquals":["States.ALL"],"Next":"workflow:Failed"}],"Branches":[{"StartAt":"step:Create Something New","States":{"step:Create Something New":{"Type":"Pass","Comment":"Pass step for step:Create Something New - test stage","End":true}}},{"StartAt":"step:Call Some API","States":{"step:Call Some API":{"End":true,"Retry":[{"ErrorEquals":["States.ALL"],"IntervalSeconds":30,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"API step for step:Call Some API - test stage","Resource":"arn:',
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
      StateMachineName: 'test-workflow-test',
      StateMachineType: 'STANDARD',
    })
  })
})
