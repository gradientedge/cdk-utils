import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import * as types from '../../lib/types'

interface TestStackProps extends types.CommonStackProps {
  testLambda: any
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
    const testLambdaFunction = this.lambdaManager.createLambdaFunction(
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
        handler: testLambdaFunction,
        defaultCorsPreflightOptions: {
          allowOrigins: apig.Cors.ALL_ORIGINS,
        },
        proxy: false,
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
      true,
      ['https://example.gradientedge.io'],
      ['GET', 'POST'],
      ['Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Site-Key,X-Site-Lang,X-Site-Locale']
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
    template.resourceCountIs('AWS::IAM::Role', 2)
    template.resourceCountIs('AWS::Lambda::LayerVersion', 1)
    template.resourceCountIs('AWS::Lambda::Permission', 16)
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    template.resourceCountIs('AWS::ApiGateway::Deployment', 2)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Resource', 4)
    template.resourceCountIs('AWS::ApiGateway::Method', 13)
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
    template.hasOutput('testResource2TestAnotherProxyResourceId', {})
  })
})

describe('TestApiConstruct', () => {
  test('provisions new rest api as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'test-lambda-rest-api-test',
    })
  })
})

describe('TestApiConstruct', () => {
  test('provisions new rest api deployment as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Deployment', {
      Description: 'Automatically created by the RestApi construct',
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

    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: '{test-another+}',
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
