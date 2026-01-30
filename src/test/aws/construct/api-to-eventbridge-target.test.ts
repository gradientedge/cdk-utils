import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { ApiToEventBridgeTarget, ApiToEventBridgeTargetProps, CommonStack } from '../../../lib/aws/index.js'

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
            restApiName: 'test-restapi',
          },
        },
        apiRootPaths: this.node.tryGetContext('apiRootPaths'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
        event: {
          eventBusName: 'test',
          rule: this.node.tryGetContext('testEventBridgeTargetRule'),
        },
        logLevel: this.node.tryGetContext('logLevel'),
        nodeEnv: this.node.tryGetContext('nodeEnv'),
        timezone: this.node.tryGetContext('timezone'),
        useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
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
const stack = new TestCommonStack(app, 'test-api-to-eb-stack', testStackProps)
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
    template.resourceCountIs('AWS::IAM::Role', 3)
    template.resourceCountIs('AWS::IAM::Policy', 1)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    template.resourceCountIs('AWS::ApiGateway::Stage', 1)
    template.resourceCountIs('AWS::ApiGateway::Method', 3)
    template.resourceCountIs('AWS::ApiGateway::Resource', 1)
    template.resourceCountIs('AWS::ApiGateway::DomainName', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 1)
    template.resourceCountIs('AWS::Events::Rule', 1)
    template.resourceCountIs('AWS::Events::EventBus', 1)
  })
})

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testHostedZoneHostedZoneId', {})
    template.hasOutput('testHostedZoneHostedZoneArn', {})
    template.hasOutput('testCertificateCertificateArn', {})
    template.hasOutput('testEventBusEventBusName', {})
    template.hasOutput('testEventBusEventBusArn', {})
    template.hasOutput('testLogLogGroupArn', {})
    template.hasOutput('testApiToEventbridgeTargetRuleRuleArn', {})
    template.hasOutput('testApiToEventbridgeTargetRuleRuleName', {})
    template.hasOutput('testRestApiAccessLogLogGroupArn', {})
    template.hasOutput('testRestApiId', {})
    template.hasOutput('testRestApiRootResourceId', {})
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
      Name: 'cdktest-test-restapi-test',
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

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('provisions log group as expected', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: 'test-api-to-event-bridge-target-test',
    })

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: 'cdktest-test-restapi-access-test',
    })
  })
})

describe('TestApiToEventBridgeTargetConstruct', () => {
  test('provisions new event rule as expected', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        source: ['api-to-eventbridge-target'],
      },
      Name: 'cdktest-test-eb-target-rule-test',
      State: 'ENABLED',
    })
  })
})

describe('TestApiToEventBridgeTargetConstruct with useExisting', () => {
  test('uses existing API and event bus when useExisting is true', () => {
    const useExistingProps = {
      ...testStackProps,
      name: 'test-api-eb-use-existing',
    }

    class TestStackWithExisting extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiEBWithExisting(this, useExistingProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            api: {
              certificate: this.node.tryGetContext('siteCertificate'),
              importedRestApiRef: 'test-api-id-export',
              importedRestApiRootResourceRef: 'test-root-resource-export',
              resource: 'notify',
              restApi: {
                restApiName: 'test-restapi',
              },
              useExisting: true,
              withResource: true,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            event: {
              eventBusName: 'default',
              rule: this.node.tryGetContext('testEventBridgeTargetRule'),
            },
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiEBWithExisting extends ApiToEventBridgeTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-existing-eb'
        this.initResources()
      }
    }

    const appWithExisting = new cdk.App({ context: useExistingProps })
    const stackWithExisting = new TestStackWithExisting(
      appWithExisting,
      'test-api-eb-use-existing-stack',
      useExistingProps
    )
    const templateWithExisting = Template.fromStack(stackWithExisting)

    // Should not create new API Gateway or event bus resources when using existing
    templateWithExisting.resourceCountIs('AWS::ApiGateway::RestApi', 0)
    templateWithExisting.resourceCountIs('AWS::Events::EventBus', 0)
    templateWithExisting.resourceCountIs('AWS::Logs::LogGroup', 0)
  })
})

describe('TestApiToEventBridgeTargetConstruct with SSM certificate', () => {
  test('reads certificate from SSM when useExistingCertificate is true', () => {
    const ssmCertProps = {
      ...testStackProps,
      name: 'test-api-eb-ssm-cert',
    }

    class TestStackWithSSMCert extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiEBWithSSMCert(this, ssmCertProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            api: {
              certificate: {
                certificateRegion: 'us-east-1',
                certificateSsmName: '/test/certificate/arn',
                useExistingCertificate: true,
              },
              resource: 'notify',
              restApi: {
                restApiName: 'test-restapi',
              },
              useExisting: false,
              withResource: true,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            event: {
              eventBusName: 'test',
              rule: this.node.tryGetContext('testEventBridgeTargetRule'),
            },
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiEBWithSSMCert extends ApiToEventBridgeTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-ssm-cert-eb'
        this.initResources()
      }
    }

    const appWithSSMCert = new cdk.App({ context: ssmCertProps })
    const stackWithSSMCert = new TestStackWithSSMCert(appWithSSMCert, 'test-api-eb-ssm-cert-stack', ssmCertProps)
    const templateWithSSMCert = Template.fromStack(stackWithSSMCert)

    // Should create API Gateway with SSM certificate reference
    templateWithSSMCert.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    expect(stackWithSSMCert.props).toHaveProperty('api')
  })
})

describe('TestApiToEventBridgeTargetConstruct error handling', () => {
  test('throws error when restApiName is undefined', () => {
    const errorProps = {
      ...testStackProps,
      name: 'test-api-eb-error',
    }

    class TestStackWithError extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiEBWithError(this, errorProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            api: {
              certificate: this.node.tryGetContext('siteCertificate'),
              resource: 'notify',
              restApi: {}, // Empty restApi without restApiName
              useExisting: false,
              withResource: true,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            event: {
              eventBusName: 'test',
              rule: this.node.tryGetContext('testEventBridgeTargetRule'),
            },
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiEBWithError extends ApiToEventBridgeTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-error-eb'
        this.initResources()
      }
    }

    const appWithError = new cdk.App({ context: errorProps })

    expect(() => {
      new TestStackWithError(appWithError, 'test-api-eb-error-stack', errorProps)
    }).toThrow('RestApi name undefined for test-error-eb')
  })
})

describe('TestApiToEventBridgeTargetConstruct with imported root resource', () => {
  test('uses imported root resource when importedRestApiRootResourceRef is provided', () => {
    const importedResourceProps = {
      ...testStackProps,
      name: 'test-api-eb-imported-resource',
    }

    class TestStackWithImportedResource extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiEBWithImportedResource(this, importedResourceProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            api: {
              certificate: this.node.tryGetContext('siteCertificate'),
              importedRestApiRootResourceRef: 'test-root-resource-export',
              resource: 'imported-notify',
              restApi: {
                restApiName: 'test-restapi',
              },
              useExisting: false,
              withResource: true,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            event: {
              eventBusName: 'test',
              rule: this.node.tryGetContext('testEventBridgeTargetRule'),
            },
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiEBWithImportedResource extends ApiToEventBridgeTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-imported-resource-eb'
        this.initResources()
      }
    }

    const appWithImportedResource = new cdk.App({ context: importedResourceProps })
    const stackWithImportedResource = new TestStackWithImportedResource(
      appWithImportedResource,
      'test-api-eb-imported-resource-stack',
      importedResourceProps
    )
    const templateWithImportedResource = Template.fromStack(stackWithImportedResource)

    // Should create API Gateway with imported root resource
    templateWithImportedResource.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    templateWithImportedResource.resourceCountIs('AWS::ApiGateway::Resource', 1)
    templateWithImportedResource.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'imported-notify',
    })
  })
})

describe('TestApiToEventBridgeTargetConstruct without resource', () => {
  test('returns early when withResource is false', () => {
    const withoutResourceProps = {
      ...testStackProps,
      name: 'test-api-eb-without-resource',
    }

    class TestStackWithoutResource extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiEBWithoutResource(this, withoutResourceProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            api: {
              certificate: this.node.tryGetContext('siteCertificate'),
              resource: 'notify',
              restApi: {
                restApiName: 'test-restapi',
              },
              useExisting: false,
              withResource: false,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            event: {
              eventBusName: 'test',
              rule: this.node.tryGetContext('testEventBridgeTargetRule'),
            },
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiEBWithoutResource extends ApiToEventBridgeTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-without-resource-eb'
        this.initResources()
      }
    }

    const appWithoutResource = new cdk.App({ context: withoutResourceProps })
    const stackWithoutResource = new TestStackWithoutResource(
      appWithoutResource,
      'test-api-eb-without-resource-stack',
      withoutResourceProps
    )
    const templateWithoutResource = Template.fromStack(stackWithoutResource)

    // Should create API Gateway but no additional resources or methods (except CORS OPTIONS)
    templateWithoutResource.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    templateWithoutResource.resourceCountIs('AWS::ApiGateway::Resource', 0)
  })
})
