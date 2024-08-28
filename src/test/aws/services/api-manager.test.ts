import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'

interface TestStackProps extends CommonStackProps {
  testLambda: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/lambdas.json'],
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
        testLambda: this.node.tryGetContext('testLambda'),
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
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    )
    const testRole = this.iamManager.createRoleForLambda(
      'test-role',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    )
    const testLambdaFunction = this.lambdaManager.createLambdaFunction(
      'test-lambda',
      this,
      this.props.testLambda,
      testRole,
      [testLayer],
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
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
        handler: testLambdaFunction,
        proxy: false,
        restApiName: 'test-lambda-rest-api',
      },
      testLambdaFunction
    )
    this.apiManager.createApiResource(
      `test-resource1`,
      this,
      api.root,
      'test',
      new apig.LambdaIntegration(testLambdaFunction),
      true,
      undefined,
      ['https://example.gradientedge.io'],
      ['GET', 'POST'],
      ['Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Site-Key,X-Site-Lang,X-Site-Locale']
    )
    this.apiManager.createApiResource(
      `test-resource2`,
      this,
      api.root,
      'test-another',
      new apig.LambdaIntegration(testLambdaFunction),
      false,
      undefined,
      ['https://example.gradientedge.io'],
      ['GET', 'POST'],
      ['Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Site-Key,X-Site-Lang,X-Site-Locale'],
      undefined,
      undefined,
      false,
      new apig.MockIntegration()
    )
    this.apiManager.createApiDeployment('test-deployment', this, api)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestApiConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testLambda')
  })
})

describe('TestApiConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::IAM::Role', 1)
    template.resourceCountIs('AWS::Lambda::LayerVersion', 1)
    template.resourceCountIs('AWS::Lambda::Permission', 12)
    template.resourceCountIs('AWS::Lambda::Function', 1)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    template.resourceCountIs('AWS::ApiGateway::Deployment', 2)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Resource', 3)
    template.resourceCountIs('AWS::ApiGateway::Method', 10)
  })
})

describe('TestApiConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testLambdaLayerLambdaLayerArn', {})
    template.hasOutput('testRoleArn', {})
    template.hasOutput('testRoleName', {})
    template.hasOutput('testLambdaLambdaArn', {})
    template.hasOutput('testLambdaLambdaName', {})
    template.hasOutput('testApiRestApiId', {})
    template.hasOutput('testApiRestApiName', {})
    template.hasOutput('testResource1TestResourceId', {})
    template.hasOutput('testResource1TestProxyResourceId', {})
    template.hasOutput('testResource2TestAnotherResourceId', {})
  })
})

describe('TestApiConstruct', () => {
  test('provisions new rest api as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'cdktest-test-lambda-rest-api-test',
    })
  })
})

describe('TestApiConstruct', () => {
  test('provisions new rest api deployment as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Deployment', {
      Description: 'test-api - test stage',
    })
  })
})

describe('TestApiConstruct', () => {
  test('provisions new rest api stage as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      Description: 'test-api - test stage',
      StageName: 'test',
    })
  })
})

describe('TestApiConstruct', () => {
  test('provisions new rest api resources as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'test',
    })

    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: '{test+}',
    })

    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'test-another',
    })
  })
})

describe('TestApiConstruct', () => {
  test('provisions new rest api resource methods as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
    })

    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
    })

    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'POST',
    })
  })
})
