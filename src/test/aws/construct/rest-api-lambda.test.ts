import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonStack, RestApiLambda, RestApiLambdaProps } from '../../../lib'

interface TestRestApiLambdaProps extends RestApiLambdaProps {
  testAttribute?: string
}

const testRestApiLambdaProps = {
  apiRootPaths: ['restapi'],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/aws/common/cdkConfig/dummy.json',
    'src/test/aws/common/cdkConfig/certificates.json',
    'src/test/aws/common/cdkConfig/lambdas.json',
  ],
  name: 'test-restapi-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestRestApiLambdaProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestRestApiConstruct(this, testRestApiLambdaProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        apiRootPaths: this.node.tryGetContext('apiRootPaths'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        restApiCertificate: this.node.tryGetContext('restApiCertificate'),
        restApiLambda: this.node.tryGetContext('restApiLambda'),
        testAttribute: this.node.tryGetContext('testAttribute'),
        timezone: this.node.tryGetContext('timezone'),
      },
    }
  }
}

class TestRestApiConstruct extends RestApiLambda {
  declare props: TestRestApiLambdaProps

  constructor(parent: Construct, id: string, props: TestRestApiLambdaProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test-restapi'
    this.props.restApiSource = new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    this.props.restApi = {
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
      deploy: true,
      deployOptions: {
        description: `${this.id} - ${this.props.stage} stage`,
        stageName: this.props.stage,
      },
      endpointConfiguration: {
        types: [apig.EndpointType.REGIONAL],
      },
      handler: this.restApiLambdaFunction,
      proxy: true,
      restApiName: 'test-lambda-rest-api',
    }

    this.initResources()
  }

  protected createRestApiResources(): void {}
}

const app = new cdk.App({ context: testRestApiLambdaProps })
const stack = new TestCommonStack(app, 'test-restapi-stack', testRestApiLambdaProps)
const template = Template.fromStack(stack)

describe('TestRestApiLambdaConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })
})

describe('TestRestApiLambdaConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 1)
    template.resourceCountIs('AWS::IAM::Role', 1)
    template.resourceCountIs('AWS::IAM::Policy', 0)
    template.resourceCountIs('Custom::LogRetention', 0)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Method', 4)
    template.resourceCountIs('AWS::ApiGateway::Method', 4)
    template.resourceCountIs('AWS::ApiGateway::Resource', 1)
    template.resourceCountIs('AWS::Lambda::Permission', 4)
    template.resourceCountIs('AWS::ApiGateway::DomainName', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 1)
    template.resourceCountIs('AWS::Lambda::Function', 1)
  })
})

describe('TestRestApiLambdaConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testRestapiHostedZoneHostedZoneId', {})
    template.hasOutput('testRestapiHostedZoneHostedZoneArn', {})
    template.hasOutput('testRestapiCertificateCertificateArn', {})
    template.hasOutput('testRestapiLambdaRoleArn', {})
    template.hasOutput('testRestapiLambdaRoleName', {})
    template.hasOutput('testRestapiRestapiServerLambdaArn', {})
    template.hasOutput('testRestapiLambdaRestApiRestApiId', {})
    template.hasOutput('testRestapiLambdaRestApiRestApiName', {})
    template.hasOutput('testRestapiApiDomainCustomDomainName', {})
    template.hasOutput('testRestapiCustomDomainARecordARecordDomainName', {})
  })
})

describe('TestRestApiLambdaConstruct', () => {
  test('provisions custom domain as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::DomainName', {
      DomainName: 'api-test.test.gradientedge.io',
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
      SecurityPolicy: 'TLS_1_2',
    })
  })
})

describe('TestRestApiLambdaConstruct', () => {
  test('provisions api gateway as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
      FailOnWarnings: false,
      Name: 'cdktest-test-lambda-rest-api-test',
    })
  })
})

describe('TestRestApiLambdaConstruct', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'api-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})

describe('TestRestApiLambdaConstruct', () => {
  test('provisions api gateway resources as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: '{proxy+}',
    })
  })
})

describe('TestRestApiLambdaConstruct', () => {
  test('provisions api gateway methods as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      AuthorizationType: 'NONE',
      HttpMethod: 'OPTIONS',
      Integration: {
        IntegrationResponses: [
          {
            ResponseParameters: {
              'method.response.header.Access-Control-Allow-Headers':
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
            StatusCode: '204',
          },
        ],
        RequestTemplates: {
          'application/json': '{ statusCode: 200 }',
        },
        Type: 'MOCK',
      },
      MethodResponses: [
        {
          ResponseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Origin': true,
          },
          StatusCode: '204',
        },
      ],
    })
  })
})

describe('TestRestApiLambdaConstruct', () => {
  test('provisions lambda function as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          LOG_LEVEL: 'debug',
          NODE_ENV: 'development',
          REGION: 'eu-west-1',
          TZ: 'UTC',
        },
      },
      FunctionName: 'cdktest-test-restapi-server-test',
      Handler: 'index.handler',
      MemorySize: 1024,
      Runtime: 'nodejs22.x',
      Timeout: 300,
    })
  })
})
