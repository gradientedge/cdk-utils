import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import { ApiToEventBridgeTarget } from '../../lib/construct'
import * as types from '../../lib/types'

interface TestStackProps extends types.ApiToEventBridgeTargetProps {}

const testStackProps = {
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  name: 'test-api-to-eb-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stage: 'test',
  stackName: 'test',
  apiSubDomain: 'api',
  apiRootPaths: [''],
  extraContexts: [
    'src/test/common/cdkConfig/dummy.json',
    'src/test/common/cdkConfig/certificates.json',
    'src/test/common/cdkConfig/lambdas.json',
    'src/test/common/cdkConfig/rules.json',
  ],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends common.CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApiToEventBridgeTarget(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        apiRootPaths: this.node.tryGetContext('apiRootPaths'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          resource: 'notify',
          withResource: true,
        },
        lambda: {
          function: this.node.tryGetContext('testApiDestinedLambda'),
          layerSource: new lambda.AssetCode('./app/api-destined-function/layers'),
          source: new lambda.AssetCode('./app/api-destined-function/src/lib'),
        },
        event: {
          eventBusName: 'test',
          ruleSuccess: this.node.tryGetContext('testLambdaRule'),
          ruleFailure: this.node.tryGetContext('testAnotherLambdaRule'),
        },
        useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        timezone: this.node.tryGetContext('timezone'),
      },
    }
  }
}

class TestApiToEventBridgeTarget extends ApiToEventBridgeTarget {
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

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('region')
    expect(stack.props.region).toEqual('eu-west-1')
  })
})

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 0)
    template.resourceCountIs('AWS::IAM::Role', 5)
    template.resourceCountIs('AWS::IAM::Policy', 5)
    template.resourceCountIs('Custom::LogRetention', 1)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Method', 3)
    template.resourceCountIs('AWS::ApiGateway::Resource', 1)
    template.resourceCountIs('AWS::Lambda::Permission', 1)
    template.resourceCountIs('AWS::ApiGateway::DomainName', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 1)
    template.resourceCountIs('AWS::Lambda::Function', 3)
    template.resourceCountIs('AWS::Events::Rule', 2)
    template.resourceCountIs('AWS::SNS::Topic', 1)
    template.resourceCountIs('AWS::Events::EventBus', 1)
  })
})

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testHostedZoneHostedZoneId', {})
    template.hasOutput('testHostedZoneHostedZoneArn', {})
    template.hasOutput('testCertificateCertificateArn', {})
    template.hasOutput('testLambdaDestinedRoleArn', {})
    template.hasOutput('testLambdaDestinedRoleName', {})
    template.hasOutput('testLambdaDestinedLayerLambdaLayerArn', {})
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

describe('TestApiToEventBridgeTargetConstruct', () => {
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

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('provisions api gateway as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
      Name: 'test-destined-rest-api-test',
    })
  })
})

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'api-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('provisions api gateway resources as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'notify',
    })
  })
})

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('provisions api gateway methods as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
      AuthorizationType: 'NONE',
      Integration: {
        IntegrationResponses: [
          {
            ResponseParameters: {
              'method.response.header.Access-Control-Allow-Headers':
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Methods': "'POST'",
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

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('provisions destined lambda function as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          REGION: 'eu-west-1',
          NODE_ENV: 'development',
          LOG_LEVEL: 'debug',
          TZ: 'UTC',
          SOURCE_ID: 'test',
        },
      },
      FunctionName: 'test-api-destined-test',
      Handler: 'lambda.handler',
      MemorySize: 1024,
      Runtime: 'nodejs14.x',
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

describe('TestApiToEventBridgeTargetConstruct', () => {
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
      Name: 'test-api-destination-success-test',
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
      Name: 'test-api-destination-failure-test',
      State: 'ENABLED',
    })
  })
})

