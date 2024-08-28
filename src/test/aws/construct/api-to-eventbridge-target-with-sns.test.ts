import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { ApiToEventBridgeTargetProps, ApiToEventBridgeTargetWithSns, CommonStack } from '../../../lib'

interface TestStackProps extends ApiToEventBridgeTargetProps {}

const testStackProps = {
  apiRootPaths: [''],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
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

    this.construct = new TestApiToEventBridgeTarget(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          resource: 'notify',
          useExisting: false,
          withResource: true,
          restApi: {
            restApiName: 'test-destined-restapi',
          },
        },
        apiRootPaths: this.node.tryGetContext('apiRootPaths'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
        event: {
          eventBusName: 'test',
          ruleFailure: this.node.tryGetContext('testAnotherLambdaRule'),
          ruleSuccess: this.node.tryGetContext('testLambdaRule'),
        },
        lambda: {
          function: this.node.tryGetContext('testApiDestinedLambda'),
          source: new lambda.AssetCode('./app/api-destined-function/src/lib'),
        },
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        timezone: this.node.tryGetContext('timezone'),
        useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
      },
    }
  }
}

class TestApiToEventBridgeTarget extends ApiToEventBridgeTargetWithSns {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test'

    this.initResources()
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-api-destined-eb-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('region')
    expect(stack.props.region).toEqual('eu-west-1')
  })
})

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 0)
    template.resourceCountIs('AWS::IAM::Role', 4)
    template.resourceCountIs('AWS::IAM::Policy', 4)
    template.resourceCountIs('Custom::LogRetention', 0)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Method', 3)
    template.resourceCountIs('AWS::ApiGateway::Resource', 1)
    template.resourceCountIs('AWS::Lambda::Permission', 1)
    template.resourceCountIs('AWS::ApiGateway::DomainName', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 1)
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('AWS::Events::Rule', 2)
    template.resourceCountIs('AWS::SNS::Topic', 1)
    template.resourceCountIs('AWS::Events::EventBus', 1)
  })
})

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testHostedZoneHostedZoneId', {})
    template.hasOutput('testHostedZoneHostedZoneArn', {})
    template.hasOutput('testCertificateCertificateArn', {})
    template.hasOutput('testLambdaDestinedRoleArn', {})
    template.hasOutput('testLambdaDestinedRoleName', {})
    template.hasOutput('testLambdaDestinedLambdaArn', {})
    template.hasOutput('testLambdaDestinedLambdaName', {})
    template.hasOutput('testDestinedEventBusEventBusName', {})
    template.hasOutput('testDestinedEventBusEventBusArn', {})
    template.hasOutput('testDestinationSuccessLogLogGroupArn', {})
    template.hasOutput('testApiDestinationRuleSuccessRuleArn', {})
    template.hasOutput('testApiDestinationRuleSuccessRuleName', {})
    template.hasOutput('testDestinationFailureLogLogGroupArn', {})
    template.hasOutput('testApiDestinationRuleFailureRuleArn', {})
    template.hasOutput('testApiDestinationRuleFailureRuleName', {})
    template.hasOutput('testDestinedTopicSubscriptionArn', {})
    template.hasOutput('testDestinedTopicSubscriptionName', {})
    template.hasOutput('testApiDomainCustomDomainName', {})
    template.hasOutput('testCustomDomainARecordARecordDomainName', {})
  })
})

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
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

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
  test('provisions api gateway as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
      Name: 'cdktest-test-destined-restapi-test',
    })
  })
})

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'api-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
  test('provisions api gateway resources as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'notify',
    })
  })
})

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
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
              'method.response.header.Access-Control-Allow-Methods': "'POST'",
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

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
  test('provisions destined lambda function as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          LOG_LEVEL: 'debug',
          NODE_ENV: 'development',
          REGION: 'eu-west-1',
          SOURCE_ID: 'test',
          TZ: 'UTC',
        },
      },
      FunctionName: 'cdktest-test-api-destined-test',
      Handler: 'lambda.handler',
      MemorySize: 1024,
      Runtime: 'nodejs18.x',
      Timeout: 60,
    })
  })

  test('provisions success log group as expected', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/test/events/api-destination-success-test',
    })
  })

  test('provisions failure log group as expected', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/test/events/api-destination-failure-test',
    })
  })
})

describe('TestApiToEventBridgeTargetWithSnsConstruct', () => {
  test('provisions new success lambda event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        detail: {
          requestContext: {
            condition: ['Success'],
          },
          responsePayload: {
            source: ['custom:api-destined-lambda'],
          },
        },
      },
      Name: 'cdktest-test-api-destination-success-test',
      State: 'ENABLED',
    })
  })

  test('provisions new failure lambda event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        detail: {
          responsePayload: {
            errorType: ['Error'],
          },
        },
      },
      Name: 'cdktest-test-api-destination-failure-test',
      State: 'ENABLED',
    })
  })
})
