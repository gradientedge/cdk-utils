import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonStack, RestApiLambdaWithCache, RestApiLambdaWithCacheProps } from '../../../lib/aws/index.js'

interface RestRestApiLambdaWithCacheProps extends RestApiLambdaWithCacheProps {
  testAttribute?: string
}

const testRestApiLambdaWithCacheProps = {
  apiRootPaths: ['restapi'],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/aws/common/cdkConfig/dummy.json',
    'src/test/aws/common/cdkConfig/certificates.json',
    'src/test/aws/common/cdkConfig/lambdas.json',
    'src/test/aws/common/cdkConfig/vpc.json',
    'src/test/aws/common/cdkConfig/elasticache.json',
  ],
  name: 'test-restapi-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
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
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        restApiCache: this.node.tryGetContext('testReplicatedElastiCache'),
        restApiCertificate: this.node.tryGetContext('restApiCertificate'),
        restApiLambda: this.node.tryGetContext('restApiLambda'),
        restApiVpc: this.node.tryGetContext('testVpc'),
        testAttribute: this.node.tryGetContext('testAttribute'),
        timezone: this.node.tryGetContext('timezone'),
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
    this.props.securityGroupExportName = `${this.id}-${this.props.stage}-VpcDefaultSecurityGroup`

    this.initResources()
  }

  protected createRestApiResources(): void {}
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
    template.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1)
  })
})

describe('TestRestApiWithCacheLambdaConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testRestapiVpcId', {})
    template.hasOutput('testRestapiVpcPublicSubnetIds', {})
    template.hasOutput('testRestapiVpcPrivateSubnetIds', {})
    template.hasOutput('testRestapiVpcPublicSubnetRouteTableIds', {})
    template.hasOutput('testRestapiVpcPrivateSubnetRouteTableIds', {})
    template.hasOutput('testRestapiVpcAvailabilityZones', {})
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
      Name: 'cdktest-test-lambda-rest-api-test',
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

describe('TestRestApiWithCacheLambdaConstruct', () => {
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
      Runtime: 'nodejs24.x',
      Timeout: 300,
    })
  })
})

describe('TestRestApiWithCacheLambdaConstruct with existing VPC', () => {
  test('uses existing VPC when useExistingVpc is true', () => {
    const existingVpcProps = {
      ...testRestApiLambdaWithCacheProps,
      env: {
        account: '123456789',
        region: 'eu-west-1',
      },
      name: 'test-restapi-existing-vpc',
    }

    class TestStackWithExistingVpc extends CommonStack {
      declare props: RestRestApiLambdaWithCacheProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestRestApiWithExistingVpc(this, existingVpcProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            logLevel: this.node.tryGetContext('logLevel'),
            nodeEnv: this.node.tryGetContext('nodeEnv'),
            restApiCache: this.node.tryGetContext('testReplicatedElastiCache'),
            restApiCertificate: this.node.tryGetContext('restApiCertificate'),
            restApiLambda: this.node.tryGetContext('restApiLambda'),
            restApiVpc: this.node.tryGetContext('testVpc'),
            testAttribute: this.node.tryGetContext('testAttribute'),
            timezone: this.node.tryGetContext('timezone'),
            useExistingVpc: true,
            vpcName: 'test-vpc',
          },
        }
      }
    }

    class TestRestApiWithExistingVpc extends RestApiLambdaWithCache {
      declare props: RestRestApiLambdaWithCacheProps

      constructor(parent: Construct, id: string, props: RestRestApiLambdaWithCacheProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-existing-vpc'
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
          restApiName: 'test-lambda-rest-api-existing',
        }
        this.initResources()
      }

      protected createRestApiResources(): void {}
    }

    const appWithExistingVpc = new cdk.App({ context: existingVpcProps })
    const stackWithExistingVpc = new TestStackWithExistingVpc(
      appWithExistingVpc,
      'test-restapi-existing-vpc-stack',
      existingVpcProps
    )
    const templateWithExistingVpc = Template.fromStack(stackWithExistingVpc)

    // Should not create new VPC
    templateWithExistingVpc.resourceCountIs('AWS::EC2::VPC', 0)
  })
})

describe('TestRestApiWithCacheLambdaConstruct with IPv6 VPC', () => {
  test('configures IPv6 security group when isIPV6 is true', () => {
    const ipv6Props = {
      ...testRestApiLambdaWithCacheProps,
      name: 'test-restapi-ipv6',
    }

    class TestStackWithIPv6 extends CommonStack {
      declare props: RestRestApiLambdaWithCacheProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestRestApiWithIPv6(this, ipv6Props.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            logLevel: this.node.tryGetContext('logLevel'),
            nodeEnv: this.node.tryGetContext('nodeEnv'),
            restApiCache: this.node.tryGetContext('testReplicatedElastiCache'),
            restApiCertificate: this.node.tryGetContext('restApiCertificate'),
            restApiLambda: this.node.tryGetContext('restApiLambda'),
            restApiVpc: {
              ...this.node.tryGetContext('testVpc'),
              isIPV6: true,
            },
            testAttribute: this.node.tryGetContext('testAttribute'),
            timezone: this.node.tryGetContext('timezone'),
          },
        }
      }
    }

    class TestRestApiWithIPv6 extends RestApiLambdaWithCache {
      declare props: RestRestApiLambdaWithCacheProps

      constructor(parent: Construct, id: string, props: RestRestApiLambdaWithCacheProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-ipv6'
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
          restApiName: 'test-lambda-rest-api-ipv6',
        }
        this.initResources()
      }

      protected createRestApiResources(): void {}
    }

    const appWithIPv6 = new cdk.App({ context: ipv6Props })
    const stackWithIPv6 = new TestStackWithIPv6(appWithIPv6, 'test-restapi-ipv6-stack', ipv6Props)
    const templateWithIPv6 = Template.fromStack(stackWithIPv6)

    // Should create security group with IPv6 rules
    templateWithIPv6.resourceCountIs('AWS::EC2::SecurityGroup', 1)
    templateWithIPv6.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIpv6: '::/0',
          Description: 'All Traffic',
          IpProtocol: '-1',
        },
      ],
    })
  })
})

describe('TestRestApiWithCacheLambdaConstruct without cache', () => {
  test('skips ElastiCache creation when restApiCache is undefined', () => {
    const noCacheProps = {
      ...testRestApiLambdaWithCacheProps,
      name: 'test-restapi-no-cache',
    }

    class TestStackWithoutCache extends CommonStack {
      declare props: RestRestApiLambdaWithCacheProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestRestApiWithoutCache(this, noCacheProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            logLevel: this.node.tryGetContext('logLevel'),
            nodeEnv: this.node.tryGetContext('nodeEnv'),
            restApiCache: undefined, // No cache
            restApiCertificate: this.node.tryGetContext('restApiCertificate'),
            restApiLambda: this.node.tryGetContext('restApiLambda'),
            restApiVpc: this.node.tryGetContext('testVpc'),
            testAttribute: this.node.tryGetContext('testAttribute'),
            timezone: this.node.tryGetContext('timezone'),
          },
        }
      }
    }

    class TestRestApiWithoutCache extends RestApiLambdaWithCache {
      declare props: RestRestApiLambdaWithCacheProps

      constructor(parent: Construct, id: string, props: RestRestApiLambdaWithCacheProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-no-cache'
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
          restApiName: 'test-lambda-rest-api-no-cache',
        }
        this.initResources()
      }

      protected createRestApiResources(): void {}
    }

    const appWithoutCache = new cdk.App({ context: noCacheProps })
    const stackWithoutCache = new TestStackWithoutCache(appWithoutCache, 'test-restapi-no-cache-stack', noCacheProps)
    const templateWithoutCache = Template.fromStack(stackWithoutCache)

    // Should not create ElastiCache
    templateWithoutCache.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 0)
  })
})
