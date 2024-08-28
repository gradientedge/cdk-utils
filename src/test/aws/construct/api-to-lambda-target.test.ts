import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { ApiToLambdaTarget, ApiToLambdaTargetProps, CommonStack } from '../../../lib'

interface TestStackProps extends ApiToLambdaTargetProps {
  testLambda: any
}

const testStackProps = {
  apiRootPaths: ['create-order'],
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
    'src/test/aws/common/cdkConfig/rules.json',
  ],
  name: 'test-api-to-eb-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApiToLambdaTarget(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          resource: 'my-resource',
          restApi: this.node.tryGetContext('testRestApi'),
          useExisting: false,
          withResource: true,
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

class TestApiToLambdaTarget extends ApiToLambdaTarget {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test'

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
    this.lambdaManager.createLambdaFunction(
      'test-src-lambda',
      this,
      this.props.testLambda,
      testRole,
      [testLayer],
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    )

    this.initResources()
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-api-to-eb-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestApiToLambdaTargetConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('region')
    expect(stack.props.region).toEqual('eu-west-1')
  })
})

describe('TestApiToLambdaTargetConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 0)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Method', 1)
    template.resourceCountIs('AWS::ApiGateway::Resource', 1)
    template.resourceCountIs('AWS::ApiGateway::DomainName', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 1)
    template.resourceCountIs('AWS::ApiGateway::BasePathMapping', 1)
    template.resourceCountIs('AWS::IAM::Role', 2)
    template.resourceCountIs('AWS::IAM::Policy', 0)
    template.resourceCountIs('AWS::Lambda::Function', 1)
  })
})

describe('TestApiToLambdaTargetConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testHostedZoneHostedZoneId', {})
    template.hasOutput('testHostedZoneHostedZoneArn', {})
    template.hasOutput('testCertificateCertificateArn', {})
    template.hasOutput('testRestApiAccessLogLogGroupArn', {})
    template.hasOutput('testLambdaRestApiRestApiId', {})
    template.hasOutput('testLambdaRestApiRestApiName', {})
    template.hasOutput('testRestApiRootResourceId', {})
    template.hasOutput('testApiDomainCustomDomainName', {})
    template.hasOutput('testCustomDomainARecordARecordDomainName', {})
  })
})

describe('TestApiToLambdaTargetConstruct', () => {
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

describe('TestApiToLambdaTargetConstruct', () => {
  test('provisions api gateway as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
      Name: 'cdktest-test-rest-api-test',
    })
  })
})

describe('TestApiToLambdaTargetConstruct', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'api-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})

describe('TestApiToLambdaTargetConstruct', () => {
  test('provisions api gateway resources as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'my-resource',
    })
  })
})

describe('TestApiToLambdaTargetConstruct', () => {
  test('provisions api gateway methods as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      AuthorizationType: 'NONE',
      HttpMethod: 'POST',
      Integration: {
        IntegrationHttpMethod: 'POST',
        Type: 'AWS_PROXY',
      },
      MethodResponses: [
        {
          ResponseParameters: {
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Content-Type': true,
          },
          StatusCode: '200',
        },
        {
          ResponseParameters: {
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Content-Type': true,
          },
          StatusCode: '400',
        },
      ],
    })
  })
})

describe('TestApiToLambdaTargetConstruct', () => {
  test('provisions log group as expected', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/custom/api/cdktest-test-test-rest-api-access-test',
      RetentionInDays: 731,
    })
  })
})

describe('TestApiToLambdaTargetConstruct', () => {
  test('provisions lambda function as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: ['arm64'],
      Code: {
        S3Bucket: 'cdk-hnb659fds-assets-123456789-eu-west-1',
        S3Key: 'd5523e3b961cf2272cb4c94da89e310809981614bd36996014e2f23058109580.zip',
      },
      Environment: {
        Variables: {
          LAST_MODIFIED_TS: 'dummy-value-for-secrets-last-modified-timestamp-test',
          LOG_LEVEL: 'info',
          REGION: 'eu-west-1',
          STAGE: 'test',
        },
      },
      FunctionName: 'cdktest-test-lambda-test',
      Handler: 'index.lambda_handler',
      Layers: [
        {
          Ref: 'testapitoebstacktestlambdalayerECE80592',
        },
      ],
      LoggingConfig: {
        LogGroup: {
          Ref: 'testapitoebstacktestsrclambdaloggroup55A5A8E0',
        },
      },
      MemorySize: 1024,
      Role: {
        'Fn::GetAtt': ['testapitoebstacktestroleD9D398F5', 'Arn'],
      },
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
})
