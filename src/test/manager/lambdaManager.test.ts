import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { Template } from 'aws-cdk-lib/assertions'
import { CommonStackProps } from '../../lib/types'
import { CommonConstruct } from '../../lib/common/commonConstruct'
import { CommonStack } from '../../lib/common/commonStack'

interface TestStackProps extends CommonStackProps {
  testLambda: any
  testLambdaPython: any
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
  extraContexts: ['src/test/common/cdkConfig/lambdas.json'],
  stageContextPath: 'src/test/common/cdkEnv',
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
        testLambdaPython: this.node.tryGetContext('testLambdaPython'),
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
      new lambda.AssetCode('src/test/common/nodejs/lib')
    )
    const testRole = this.iamManager.createRoleForLambda(
      'test-role',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    )
    this.lambdaManager.createLambdaFunction(
      'test-lambda',
      this,
      this.props.testLambda,
      testRole,
      [testLayer],
      new lambda.AssetCode('src/test/common/nodejs/lib')
    )

    const testPythonLayer = this.lambdaManager.createPythonLambdaLayer(
      'test-lambda-layer-python',
      this,
      'src/test/common/python/layers'
    )
    this.lambdaManager.createPythonLambdaFunction(
      'test-lambda-python',
      this,
      this.props.testLambdaPython,
      testRole,
      [testPythonLayer],
      'src/test/common/python/lib'
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
    template.resourceCountIs('AWS::Lambda::LayerVersion', 2)
    template.resourceCountIs('AWS::Lambda::Function', 3)
  })
})

describe('TestLambdaConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testLambdaLayerLambdaLayerArn', {})
    template.hasOutput('testLambdaLambdaArn', {})
    template.hasOutput('testLambdaLayerPythonLambdaLayerArn', {})
    template.hasOutput('testLambdaPythonLambdaArn', {})
  })
})

describe('TestLambdaConstruct', () => {
  test('provisions new layer as expected', () => {
    template.hasResourceProperties('AWS::Lambda::LayerVersion', {
      CompatibleRuntimes: ['nodejs14.x'],
      Description: 'test-lambda-layer',
      LayerName: 'test-lambda-layer-test',
    })
  })

  test('provisions new python layer as expected', () => {
    template.hasResourceProperties('AWS::Lambda::LayerVersion', {
      CompatibleRuntimes: ['python3.8'],
      Description: 'test-lambda-layer-python',
      LayerName: 'test-lambda-layer-python-test',
    })
  })

  test('provisions new lambda as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          REGION: 'eu-west-1',
        },
      },
      FunctionName: 'test-lambda-test',
      Handler: 'index.lambda_handler',
      MemorySize: 1024,
      Runtime: 'nodejs14.x',
      Timeout: 60,
    })
  })

  test('provisions new python lambda as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          REGION: 'eu-west-1',
        },
      },
      FunctionName: 'test-lambda-python-test',
      Handler: 'index.handler',
      MemorySize: 1024,
      Runtime: 'python3.8',
      Timeout: 60,
    })
  })
})
