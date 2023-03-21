import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import * as types from '../../lib/types'

interface TestStackProps extends types.CommonStackProps {
  testLambda: any
  testLambdaWithDlq: any
  testLambdaEdge: any
  testLambdaPython: any
  testLambdaAlias: any
}

const testStackProps = {
  env: {
    account: '123456789',
    region: 'us-east-1',
  },
  name: 'test-common-stack',
  domainName: 'gradientedge.io',
  region: 'us-east-1',
  stackName: 'test',
  stage: 'test',
  extraContexts: ['src/test/common/cdkConfig/lambdas.json'],
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
        testLambdaWithDlq: this.node.tryGetContext('testLambdaWithDlq'),
        testLambdaEdge: this.node.tryGetContext('testLambdaEdge'),
        testLambdaPython: this.node.tryGetContext('testLambdaPython'),
        testLambdaAlias: this.node.tryGetContext('testLambdaAlias'),
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
    this.lambdaManager.createLambdaFunction(
      'test-lambda-with-dlq',
      this,
      this.props.testLambdaWithDlq,
      testRole,
      [testLayer],
      new lambda.AssetCode('src/test/common/nodejs/lib')
    )

    this.lambdaManager.createEdgeFunction(
      'test-lambda-edge',
      this,
      this.props.testLambdaEdge,
      [],
      new lambda.AssetCode('src/test/common/nodejs/lib'),
      testRole
    )

    this.lambdaManager.createLambdaDockerFunction(
      'test-lambda-docker',
      this,
      this.props.testLambda,
      testRole,
      lambda.DockerImageCode.fromImageAsset('src/test/common/docker')
    )

    this.lambdaManager.createLambdaFunctionAlias(
      'test-lambda-alias',
      this,
      this.props.testLambdaAlias,
      testLambda.latestVersion
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestLambdaConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Lambda props undefined')
  })
})

describe('TestLambdaConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Lambda::LayerVersion', 1)
    template.resourceCountIs('AWS::Lambda::Function', 5)
    template.resourceCountIs('AWS::SQS::Queue', 2)
    template.resourceCountIs('AWS::Lambda::Alias', 1)
  })
})

describe('TestLambdaConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testLambdaLayerLambdaLayerArn', {})
    template.hasOutput('testLambdaLambdaArn', {})
    template.hasOutput('testLambdaLambdaName', {})
    template.hasOutput('testLambdaEdgeEdgeArn', {})
    template.hasOutput('testLambdaEdgeEdgeFunctionArn', {})
    template.hasOutput('testLambdaEdgeEdgeFunctionName', {})
    template.hasOutput('testLambdaWithDlqRdqQueueArn', {})
    template.hasOutput('testLambdaWithDlqRdqQueueName', {})
    template.hasOutput('testLambdaWithDlqRdqQueueUrl', {})
    template.hasOutput('testLambdaWithDlqDlqQueueArn', {})
    template.hasOutput('testLambdaWithDlqDlqQueueName', {})
    template.hasOutput('testLambdaWithDlqDlqQueueUrl', {})
    template.hasOutput('testLambdaWithDlqLambdaArn', {})
    template.hasOutput('testLambdaWithDlqLambdaName', {})
    template.hasOutput('testLambdaDockerLambdaArn', {})
    template.hasOutput('testLambdaDockerLambdaName', {})
  })
})

describe('TestLambdaConstruct', () => {
  test('provisions new layer as expected', () => {
    template.hasResourceProperties('AWS::Lambda::LayerVersion', {
      CompatibleRuntimes: ['nodejs18.x'],
      Description: 'test-lambda-layer',
      LayerName: 'test-lambda-layer-test',
    })
  })

  test('provisions new lambda as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          REGION: 'us-east-1',
        },
      },
      FunctionName: 'test-lambda-test',
      Handler: 'index.lambda_handler',
      MemorySize: 1024,
      Runtime: 'nodejs18.x',
      Timeout: 60,
    })
  })

  test('provisions new edge lambda as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'test-lambda-edge-test',
      Handler: 'index.handler',
      MemorySize: 1024,
      Runtime: 'nodejs18.x',
      Timeout: 60,
    })
  })

  test('provisions new lambda alias as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Alias', {
      ProvisionedConcurrencyConfig: { ProvisionedConcurrentExecutions: 1 },
      Name: 'test-alias',
    })
  })
})

describe('TestLambdaConstruct', () => {
  test('provisions new redrive queue as expected', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: 'test-lambda-with-error-handling-redriveq-test',
      ReceiveMessageWaitTimeSeconds: 20,
      VisibilityTimeout: 300,
      MessageRetentionPeriod: 604800,
    })
  })

  test('provisions new dead letter queue as expected', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: 'test-lambda-with-error-handling-dlq-test',
      ReceiveMessageWaitTimeSeconds: 20,
      VisibilityTimeout: 300,
      MessageRetentionPeriod: 604800,
    })
  })
})
