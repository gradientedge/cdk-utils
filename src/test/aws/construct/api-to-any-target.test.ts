import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { ApiToAnyTarget, ApiToAnyTargetProps, CommonStack } from '../../../lib'

interface TestStackProps extends ApiToAnyTargetProps {
  testLambda: any
}

const testStackProps = {
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'src/test/aws/common/cdkConfig/apiConfigs.json',
    'src/test/aws/common/cdkConfig/dummy.json',
    'src/test/aws/common/cdkConfig/certificates.json',
    'src/test/aws/common/cdkConfig/lambdas.json',
  ],
  name: 'test-api-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApiToAnyTarget(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          restApi: this.node.tryGetContext('testRestApiSample'),
          useExisting: false,
          withResource: false,
        },
        apiRootPaths: this.node.tryGetContext('apiRootPaths'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
        lambdaFunctionName: `test-lambda-test`,
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        testLambda: this.node.tryGetContext('testLambda'),
        timezone: this.node.tryGetContext('timezone'),
        useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
      },
    }
  }
}

class TestApiToAnyTarget extends ApiToAnyTarget {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props
    this.id = 'test'
    this.initResources()
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-api-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestApiToAnyTargetConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('region')
    expect(stack.props.region).toEqual('eu-west-1')
  })
})

describe('TestApiToAnyTargetConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 0)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Method', 1)
    template.resourceCountIs('AWS::ApiGateway::Resource', 0)
    template.resourceCountIs('AWS::ApiGateway::DomainName', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 1)
    template.resourceCountIs('AWS::ApiGateway::BasePathMapping', 1)
  })
})

describe('TestApiToAnyTargetConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testHostedZoneHostedZoneId', {})
    template.hasOutput('testHostedZoneHostedZoneArn', {})
    template.hasOutput('testCertificateCertificateArn', {})
    template.hasOutput('testRestApiAccessLogLogGroupArn', {})
    template.hasOutput('testRestApiId', {})
    template.hasOutput('testRestApiRootResourceId', {})
    template.hasOutput('testApiDomainCustomDomainName', {})
    template.hasOutput('testCustomDomainARecordARecordDomainName', {})
  })
})

describe('TestApiToAnyTargetConstruct', () => {
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

describe('TestApiToAnyTargetConstruct', () => {
  test('provisions api gateway as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
      Name: 'cdktest-service-test',
    })
  })
})

describe('TestApiToAnyTargetConstruct', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'api-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})

describe('TestApiToAnyTargetConstruct', () => {
  test('provisions api gateway methods as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      ApiKeyRequired: false,
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
        RequestTemplates: { 'application/json': '{ statusCode: 200 }' },
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

describe('TestApiToAnyTargetConstruct', () => {
  test('provisions log group as expected', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/cdktest-test-access-test',
      RetentionInDays: 731,
    })
  })
})
