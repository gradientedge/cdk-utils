import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
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
  testSubmitStepApi: any
  testSubmitWorkflow: any
  testAnotherLogGroup: any
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
    'src/test/common/cdkConfig/lambdas.json',
    'src/test/common/cdkConfig/logs.json',
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
        testSubmitStepApi: this.node.tryGetContext('testSubmitStepApi'),
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
        testSubmitWorkflow: this.node.tryGetContext('testSubmitWorkflow'),
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
      .next(
        testSubmitStepCreateSomethingParallel
          .branch(testSubmitStepCreateSomethingNew)
          .branch(testSubmitStepApi)
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
            '{"StartAt":"step:Create Something","States":{"step:Create Something":{"Next":"step:Something Validated?","Retry":[{"ErrorEquals":["Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"Lambda step for step:Create Something - test stage","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
            },
            '","Payload.$":"$"}},"step:Something Validated?":{"Type":"Choice","Comment":"Choice step for step:Something Validated? - test stage","Choices":[{"Variable":"$.detail.id","IsNull":true,"Next":"workflow:Failed"}],"Default":"step:Create Something Else"},"step:Create Something Else":{"Next":"parallel:Create Something","Retry":[{"ErrorEquals":["Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","Comment":"Lambda step for step:Create Something Else - test stage","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': ['testcommonstacktestlambda5B168AC2', 'Arn'],
            },
            '","Payload.$":"$"}},"parallel:Create Something":{"Type":"Parallel","Comment":"Parallel step for parallel:Create Something - test stage","Next":"workflow:Complete","Catch":[{"ErrorEquals":["States.ALL"],"Next":"workflow:Failed"}],"Branches":[{"StartAt":"step:Create Something New","States":{"step:Create Something New":{"Type":"Pass","Comment":"Pass step for step:Create Something New - test stage","End":true}}},{"StartAt":"step:Call Some API","States":{"step:Call Some API":{"End":true,"Type":"Task","Comment":"API step for step:Call Some API - test stage","Resource":"arn:',
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
            '","Stage":"test","AuthType":"NO_AUTH"}}}}]},"workflow:Complete":{"Type":"Succeed","Comment":"Succeed step for workflow:Complete - test stage"},"workflow:Failed":{"Type":"Fail","Comment":"Fail step for workflow:Failed - test stage"}}}',
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