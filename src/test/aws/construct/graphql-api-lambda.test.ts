import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonStack, GraphQLApiLambda, GraphQlApiLambdaProps } from '../../../lib'

interface testGraphqlProps extends GraphQlApiLambdaProps {
  testAttribute?: string
}

const testGraphqlProps = {
  apiRootPaths: ['graphql'],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/aws/common/cdkConfig/dummy.json',
    'src/test/aws/common/cdkConfig/certificates.json',
    'src/test/aws/common/cdkConfig/lambdas.json',
  ],
  name: 'test-graphql-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: testGraphqlProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestGraphQLApiConstruct(this, testGraphqlProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        apiRootPaths: this.node.tryGetContext('apiRootPaths'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
        graphQLApiCertificate: this.node.tryGetContext('graphQLApiCertificate'),
        graphqlApi: this.node.tryGetContext('graphqlApi'),
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        testAttribute: this.node.tryGetContext('testAttribute'),
        timezone: this.node.tryGetContext('timezone'),
      },
    }
  }
}

class TestGraphQLApiConstruct extends GraphQLApiLambda {
  declare props: testGraphqlProps

  constructor(parent: Construct, id: string, props: testGraphqlProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test-graphql'
    this.props.graphQLApiSource = new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    this.props.graphqlRestApi = {
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
      handler: this.graphQLApiLambdaFunction,
      proxy: true,
      restApiName: 'test-lambda-rest-api',
    }

    this.initResources()
  }
}

const app = new cdk.App({ context: testGraphqlProps })
const stack = new TestCommonStack(app, 'test-graphql-stack', testGraphqlProps)
const template = Template.fromStack(stack)

describe('TestGraphQLApiLambdaConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })
})

describe('TestGraphQLApiLambdaConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 1)
    template.resourceCountIs('AWS::IAM::Role', 2)
    template.resourceCountIs('AWS::IAM::Policy', 1)
    template.resourceCountIs('Custom::LogRetention', 1)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Method', 4)
    template.resourceCountIs('AWS::ApiGateway::Method', 4)
    template.resourceCountIs('AWS::ApiGateway::Resource', 1)
    template.resourceCountIs('AWS::Lambda::Permission', 4)
    template.resourceCountIs('AWS::ApiGateway::DomainName', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 1)
    template.resourceCountIs('AWS::Lambda::Function', 2)
  })
})

describe('TestGraphQLApiLambdaConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testGraphqlHostedZoneHostedZoneId', {})
    template.hasOutput('testGraphqlHostedZoneHostedZoneArn', {})
    template.hasOutput('testGraphqlCertificateCertificateArn', {})
    template.hasOutput('testGraphqlLambdaRoleArn', {})
    template.hasOutput('testGraphqlLambdaRoleName', {})
    template.hasOutput('testGraphqlGraphqlServerLambdaArn', {})
    template.hasOutput('testGraphqlLambdaRestApiRestApiId', {})
    template.hasOutput('testGraphqlLambdaRestApiRestApiName', {})
    template.hasOutput('testGraphqlApiDomainCustomDomainName', {})
    template.hasOutput('testGraphqlCustomDomainARecordARecordDomainName', {})
  })
})

describe('TestGraphQLApiLambdaConstruct', () => {
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

describe('TestGraphQLApiLambdaConstruct', () => {
  test('provisions api gateway as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
      FailOnWarnings: false,
      Name: 'test-lambda-rest-api-test',
    })
  })
})

describe('TestGraphQLApiLambdaConstruct', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'api-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})

describe('TestGraphQLApiLambdaConstruct', () => {
  test('provisions api gateway resources as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: '{proxy+}',
    })
  })
})

describe('TestGraphQLApiLambdaConstruct', () => {
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

describe('TestGraphQLApiLambdaConstruct', () => {
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
      FunctionName: 'test-graphql-server-test',
      Handler: 'index.handler',
      MemorySize: 1024,
      Runtime: 'nodejs18.x',
      Timeout: 300,
    })
  })
})
