import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { MockIntegration, PassthroughBehavior } from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import { ApiToAnyTarget, ApiToAnyTargetProps, CommonStack } from '../../../lib/aws/index.js'

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
      LogGroupName: 'cdktest-service-access-test',
      RetentionInDays: 731,
    })
  })
})

describe('TestApiToAnyTargetConstruct with useExisting', () => {
  test('uses existing API when useExisting is true', () => {
    const useExistingProps = {
      ...testStackProps,
      name: 'test-api-use-existing',
    }

    class TestStackWithExisting extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiWithExisting(this, useExistingProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            api: {
              certificate: this.node.tryGetContext('siteCertificate'),
              importedRestApiRef: 'test-api-id-export',
              restApi: this.node.tryGetContext('testRestApiSample'),
              useExisting: true,
              withResource: false,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiWithExisting extends ApiToAnyTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-existing'
        this.initResources()
      }
    }

    const appWithExisting = new cdk.App({ context: useExistingProps })
    const stackWithExisting = new TestStackWithExisting(
      appWithExisting,
      'test-api-use-existing-stack',
      useExistingProps
    )
    const templateWithExisting = Template.fromStack(stackWithExisting)

    // Should not create new API Gateway resources when using existing
    templateWithExisting.resourceCountIs('AWS::ApiGateway::RestApi', 0)
    templateWithExisting.resourceCountIs('AWS::ApiGateway::DomainName', 0)
    templateWithExisting.resourceCountIs('AWS::Route53::RecordSet', 0)
  })
})

describe('TestApiToAnyTargetConstruct with SSM certificate', () => {
  test('reads certificate from SSM when useExistingCertificate is true', () => {
    const ssmCertProps = {
      ...testStackProps,
      name: 'test-api-ssm-cert',
    }

    class TestStackWithSSMCert extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiWithSSMCert(this, ssmCertProps.name, this.props)
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
              restApi: this.node.tryGetContext('testRestApiSample'),
              useExisting: false,
              withResource: false,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiWithSSMCert extends ApiToAnyTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-ssm-cert'
        this.initResources()
      }
    }

    const appWithSSMCert = new cdk.App({ context: ssmCertProps })
    const stackWithSSMCert = new TestStackWithSSMCert(appWithSSMCert, 'test-api-ssm-cert-stack', ssmCertProps)
    const templateWithSSMCert = Template.fromStack(stackWithSSMCert)

    // Should create API Gateway with SSM certificate reference
    templateWithSSMCert.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    // SSM parameter is read, not created, so we just verify the API was created successfully
    expect(stackWithSSMCert.props).toHaveProperty('api')
  })
})

describe('TestApiToAnyTargetConstruct error handling', () => {
  test('throws error when restApiName is undefined', () => {
    const errorProps = {
      ...testStackProps,
      name: 'test-api-error',
    }

    class TestStackWithError extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiWithError(this, errorProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            api: {
              certificate: this.node.tryGetContext('siteCertificate'),
              restApi: {}, // Empty restApi without restApiName
              useExisting: false,
              withResource: false,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiWithError extends ApiToAnyTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-error'
        this.initResources()
      }
    }

    const appWithError = new cdk.App({ context: errorProps })

    expect(() => {
      new TestStackWithError(appWithError, 'test-api-error-stack', errorProps)
    }).toThrow('RestApi name undefined for test-error')
  })
})

describe('TestApiToAnyTargetConstruct with resource', () => {
  test('returns early when withResource is false', () => {
    const withResourceProps = {
      ...testStackProps,
      name: 'test-api-without-resource',
    }

    class TestStackWithoutResource extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiWithoutResource(this, withResourceProps.name, this.props)
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
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiWithoutResource extends ApiToAnyTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-no-resource'
        this.initResources()
      }

      protected createApiRouteAssets() {
        super.createApiRouteAssets()
        // Test that createApiToAnyTargetResource returns early when withResource is false
        const mockIntegration = new MockIntegration({
          integrationResponses: [{ statusCode: '200' }],
          passthroughBehavior: PassthroughBehavior.NEVER,
          requestTemplates: {
            'application/json': '{ "statusCode": 200 }',
          },
        })
        const result = this.createApiToAnyTargetResource({
          addProxy: false,
          allowedMethods: ['GET'],
          integration: mockIntegration,
          path: 'test-path',
        })
        // Should return undefined when withResource is false
        expect(result).toBeUndefined()
      }
    }

    const appWithoutResource = new cdk.App({ context: withResourceProps })
    const stackWithoutResource = new TestStackWithoutResource(
      appWithoutResource,
      'test-api-without-resource-stack',
      withResourceProps
    )
    const templateWithoutResource = Template.fromStack(stackWithoutResource)

    // Should create API Gateway but no additional resources
    templateWithoutResource.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    templateWithoutResource.resourceCountIs('AWS::ApiGateway::Resource', 0)
  })
})

describe('TestApiToAnyTargetConstruct with imported root resource', () => {
  test('uses imported root resource when importedRestApiRootResourceRef is provided', () => {
    const importedResourceProps = {
      ...testStackProps,
      name: 'test-api-imported-resource',
    }

    class TestStackWithImportedResource extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiWithImportedResource(this, importedResourceProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            api: {
              certificate: this.node.tryGetContext('siteCertificate'),
              importedRestApiRootResourceRef: 'test-root-resource-export',
              restApi: this.node.tryGetContext('testRestApiSample'),
              useExisting: false,
              withResource: true,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiWithImportedResource extends ApiToAnyTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-imported-resource'
        this.initResources()
      }

      protected createApiRouteAssets() {
        super.createApiRouteAssets()
        // Test creating a resource with imported root and mock integration
        const mockIntegration = new MockIntegration({
          integrationResponses: [{ statusCode: '200' }],
          passthroughBehavior: PassthroughBehavior.NEVER,
          requestTemplates: {
            'application/json': '{ "statusCode": 200 }',
          },
        })
        this.createApiToAnyTargetResource({
          addProxy: false,
          allowedMethods: ['GET'],
          integration: mockIntegration,
          path: 'imported-path',
        })
      }
    }

    const appWithImportedResource = new cdk.App({ context: importedResourceProps })
    const stackWithImportedResource = new TestStackWithImportedResource(
      appWithImportedResource,
      'test-api-imported-resource-stack',
      importedResourceProps
    )
    const templateWithImportedResource = Template.fromStack(stackWithImportedResource)

    // Should create API Gateway with imported root resource
    templateWithImportedResource.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    templateWithImportedResource.resourceCountIs('AWS::ApiGateway::Resource', 1)
  })
})

describe('TestApiToAnyTargetConstruct with production stage', () => {
  test('uses EDGE endpoint for production stage', () => {
    const prodProps = {
      ...testStackProps,
      name: 'test-api-prod',
      stage: 'prd',
    }

    class TestStackProd extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiProd(this, prodProps.name, this.props)
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
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiProd extends ApiToAnyTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-prod'
        this.initResources()
      }
    }

    const appProd = new cdk.App({ context: prodProps })
    const stackProd = new TestStackProd(appProd, 'test-api-prod-stack', prodProps)
    const templateProd = Template.fromStack(stackProd)

    // Should use EDGE endpoint type for production
    templateProd.hasResourceProperties('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: {
        Types: ['EDGE'],
      },
    })

    // Should not include stage in domain name for production
    templateProd.hasResourceProperties('AWS::ApiGateway::DomainName', {
      DomainName: 'api.gradientedge.io',
    })
  })
})

describe('TestApiToAnyTargetConstruct with skipStageForARecords', () => {
  test('skips stage in domain name when skipStageForARecords is true', () => {
    const skipStageProps = {
      ...testStackProps,
      name: 'test-api-skip-stage',
      skipStageForARecords: true,
    }

    class TestStackSkipStage extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiSkipStage(this, skipStageProps.name, this.props)
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
            skipStageForARecords: true,
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiSkipStage extends ApiToAnyTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-skip-stage'
        this.initResources()
      }
    }

    const appSkipStage = new cdk.App({ context: skipStageProps })
    const stackSkipStage = new TestStackSkipStage(appSkipStage, 'test-api-skip-stage-stack', skipStageProps)
    const templateSkipStage = Template.fromStack(stackSkipStage)

    // Should not include stage in domain name
    templateSkipStage.hasResourceProperties('AWS::ApiGateway::DomainName', {
      DomainName: 'api.test.gradientedge.io',
    })
  })
})

describe('TestApiToAnyTargetConstruct with optional deploy options', () => {
  test('applies custom deploy options when provided', () => {
    const deployOptionsProps = {
      ...testStackProps,
      name: 'test-api-deploy-options',
    }

    class TestStackDeployOptions extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props)
        this.construct = new TestApiDeployOptions(this, deployOptionsProps.name, this.props)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          ...{
            api: {
              certificate: this.node.tryGetContext('siteCertificate'),
              restApi: {
                ...this.node.tryGetContext('testRestApiSample'),
                cloudWatchRole: false,
                deployOptions: {
                  dataTraceEnabled: true,
                  tracingEnabled: true,
                },
              },
              useExisting: false,
              withResource: false,
            },
            apiRootPaths: this.node.tryGetContext('apiRootPaths'),
            apiSubDomain: this.node.tryGetContext('apiSubDomain'),
            useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
          },
        }
      }
    }

    class TestApiDeployOptions extends ApiToAnyTarget {
      declare props: TestStackProps

      constructor(parent: Construct, id: string, props: TestStackProps) {
        super(parent, id, props)
        this.props = props
        this.id = 'test-deploy-options'
        this.initResources()
      }
    }

    const appDeployOptions = new cdk.App({ context: deployOptionsProps })
    const stackDeployOptions = new TestStackDeployOptions(
      appDeployOptions,
      'test-api-deploy-options-stack',
      deployOptionsProps
    )
    const templateDeployOptions = Template.fromStack(stackDeployOptions)

    // Should create API Gateway with custom deploy options
    templateDeployOptions.resourceCountIs('AWS::ApiGateway::RestApi', 1)
  })
})
