import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import { RestApiLambdaWithCache } from '../../lib/construct'
import * as types from '../../lib/types'

interface RestRestApiLambdaWithCacheProps extends types.RestApiLambdaWithCacheProps {
  testAttribute?: string
}

const testRestApiLambdaWithCacheProps = {
  name: 'test-restapi-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stage: 'test',
  stackName: 'test',
  apiSubDomain: 'api',
  apiRootPaths: ['restapi'],
  extraContexts: [
    'src/test/common/cdkConfig/dummy.json',
    'src/test/common/cdkConfig/certificates.json',
    'src/test/common/cdkConfig/lambdas.json',
    'src/test/common/cdkConfig/vpc.json',
    'src/test/common/cdkConfig/elasticache.json',
  ],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends common.CommonStack {
  declare props: RestRestApiLambdaWithCacheProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestRestApiWithCacheApiConstruct(this, testRestApiLambdaWithCacheProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        apiRootPaths: this.node.tryGetContext('apiRootPaths'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
        restApiCertificate: this.node.tryGetContext('restApiCertificate'),
        restApiLambda: this.node.tryGetContext('restApiLambda'),
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        testAttribute: this.node.tryGetContext('testAttribute'),
        timezone: this.node.tryGetContext('timezone'),
        restApiVpc: this.node.tryGetContext('testVpc'),
        restApiElastiCache: this.node.tryGetContext('testReplicatedElastiCache'),
      },
    }
  }
}

class TestRestApiWithCacheApiConstruct extends RestApiLambdaWithCache {
  declare props: RestRestApiLambdaWithCacheProps

  constructor(parent: Construct, id: string, props: RestRestApiLambdaWithCacheProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test-restapi'
    this.props.restApiSource = new lambda.AssetCode('src/test/common/nodejs/lib')
    this.props.restApi = {
      deploy: true,
      restApiName: 'test-lambda-rest-api',
      deployOptions: {
        description: `${this.id} - ${this.props.stage} stage`,
        stageName: this.props.stage,
      },
      endpointConfiguration: {
        types: [apig.EndpointType.REGIONAL],
      },
      handler: this.restApiLambdaFunction,
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
      proxy: true,
    }
    this.props.securityGroupExportName = `${this.id}-${this.props.stage}-VpcDefaultSecurityGroup`

    this.initResources()
  }
}

const app = new cdk.App({ context: testRestApiLambdaWithCacheProps })
const stack = new TestCommonStack(app, 'test-restapi-stack', testRestApiLambdaWithCacheProps)
const template = Template.fromStack(stack)

describe('TestRestApiWithCacheLambdaConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })
})

describe('TestRestApiWithCacheLambdaConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::EC2::VPC', 1)
    template.resourceCountIs('AWS::EC2::Route', 4)
    template.resourceCountIs('AWS::EC2::RouteTable', 4)
    template.resourceCountIs('AWS::EC2::Subnet', 4)
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
    template.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1)
  })
})

describe('TestRestApiWithCacheLambdaConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('commonVpcId', {})
    template.hasOutput('commonVpcPrivateSubnetIds', {})
    template.hasOutput('testRestapiHostedZoneHostedZoneId', {})
    template.hasOutput('testRestapiHostedZoneHostedZoneArn', {})
    template.hasOutput('testRestapiCertificateCertificateArn', {})
    template.hasOutput('testRestapiLambdaRoleArn', {})
    template.hasOutput('testRestapiLambdaRoleName', {})
    template.hasOutput('testRestapiRestapiServerLambdaArn', {})
    template.hasOutput('testRestapiRestapiServerLambdaName', {})
    template.hasOutput('testRestapiLambdaRestApiRestApiId', {})
  })
})

describe('TestRestApiWithCacheLambdaConstruct', () => {
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

describe('TestRestApiWithCacheLambdaConstruct', () => {
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

describe('TestRestApiWithCacheLambdaConstruct', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'api-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})

describe('TestRestApiWithCacheLambdaConstruct', () => {
  test('provisions api gateway resources as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: '{proxy+}',
    })
  })
})

describe('TestRestApiWithCacheLambdaConstruct', () => {
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
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
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
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true,
          },
          StatusCode: '204',
        },
      ],
    })
  })
})

describe('TestRestApiWithCacheLambdaConstruct', () => {
  test('provisions lambda function as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          REGION: 'eu-west-1',
          NODE_ENV: 'development',
          LOG_LEVEL: 'debug',
          TZ: 'UTC',
        },
      },
      FunctionName: 'test-restapi-server-test',
      Handler: 'index.handler',
      MemorySize: 1024,
      Runtime: 'nodejs18.x',
      Timeout: 300,
    })
  })
})
