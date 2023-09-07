import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'

interface TestStackProps extends CommonStackProps {
  testLambda: any
  testLambdaAlias: any
  testLambdaEdge: any
  testLambdaPython: any
  testLambdaWithConcurrency: any
  testLambdaWithDlq: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'us-east-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/lambdas.json'],
  name: 'test-common-stack',
  region: 'us-east-1',
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
        testLambda: this.node.tryGetContext('testLambda'),
        testLambdaAlias: this.node.tryGetContext('testLambdaAlias'),
        testLambdaEdge: this.node.tryGetContext('testLambdaEdge'),
        testLambdaPython: this.node.tryGetContext('testLambdaPython'),
        testLambdaWithConcurrency: this.node.tryGetContext('testLambdaWithConcurrency'),
        testLambdaWithDlq: this.node.tryGetContext('testLambdaWithDlq'),
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
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testLayer = this.lambdaManager.createLambdaLayer(
      'test-lambda-layer',
      this,
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
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
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    )
    this.lambdaManager.createLambdaFunction(
      'test-lambda-with-dlq',
      this,
      this.props.testLambdaWithDlq,
      testRole,
      [testLayer],
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    )
    this.lambdaManager.createLambdaFunction(
      'test-lambda-with-concurrency',
      this,
      this.props.testLambdaWithConcurrency,
      testRole,
      [testLayer],
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    )

    this.lambdaManager.createEdgeFunction(
      'test-lambda-edge',
      this,
      this.props.testLambdaEdge,
      [],
      new lambda.AssetCode('src/test/aws/common/nodejs/lib'),
      testRole
    )

    this.lambdaManager.createLambdaDockerFunction(
      'test-lambda-docker',
      this,
      this.props.testLambda,
      testRole,
      lambda.DockerImageCode.fromImageAsset('src/test/aws/common/docker')
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
    template.resourceCountIs('AWS::Lambda::Function', 6)
    template.resourceCountIs('AWS::SQS::Queue', 2)
    template.resourceCountIs('AWS::Lambda::Alias', 2)
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
    template.hasOutput('testLambdaWithConcurrencyLambdaArn', {})
    template.hasOutput('testLambdaWithConcurrencyLambdaName', {})
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
      Tags: [
        {
          Key: 'testTagName1',
          Value: 'testTagValue1',
        },
        {
          Key: 'testTagName2',
          Value: 'testTagValue2',
        },
      ],
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
      Name: 'test-alias',
      ProvisionedConcurrencyConfig: { ProvisionedConcurrentExecutions: 1 },
    })
  })
})

describe('TestLambdaConstruct', () => {
  test('provisions new lambda with concurrency settings as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          REGION: 'us-east-1',
        },
      },
      FunctionName: 'test-lambda-concurrency-test',
      Handler: 'index.lambda_handler',
      MemorySize: 1024,
      Runtime: 'nodejs18.x',
      Timeout: 60,
    })
  })

  test('provisions new lambda alias as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Alias', {
      Name: 'test-concurrent-alias',
      ProvisionedConcurrencyConfig: { ProvisionedConcurrentExecutions: 2 },
    })
  })
})

describe('TestLambdaConstruct', () => {
  test('provisions new redrive queue as expected', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      MessageRetentionPeriod: 604800,
      QueueName: 'test-lambda-with-error-handling-redriveq-test',
      ReceiveMessageWaitTimeSeconds: 20,
      VisibilityTimeout: 300,
    })
  })

  test('provisions new dead letter queue as expected', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      MessageRetentionPeriod: 604800,
      QueueName: 'test-lambda-with-error-handling-dlq-test',
      ReceiveMessageWaitTimeSeconds: 20,
      VisibilityTimeout: 300,
    })
  })
})
