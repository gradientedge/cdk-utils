import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { ApiToEventBridgeTargetProps, ApiToEventBridgeTargetWithSns, CommonStack } from '../../src/index.js'

interface TestStackProps extends ApiToEventBridgeTargetProps {}

/* Test with useExisting: true and withResource: false - exercises all the early-return branches */
const testStackPropsUseExisting = {
  apiRootPaths: [''],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/dummy.json',
    'packages/aws/test/common/cdkConfig/certificates.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/rules.json',
  ],
  name: 'test-api-to-eb-use-existing-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStackUseExisting extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApiToEventBridgeTargetUseExisting(this, testStackPropsUseExisting.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          importedRestApiRef: 'test-imported-rest-api-id',
          resource: 'notify',
          useExisting: true,
          withResource: false,
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

class TestApiToEventBridgeTargetUseExisting extends ApiToEventBridgeTargetWithSns {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test'

    this.initResources()
  }
}

const appUseExisting = new cdk.App({ context: testStackPropsUseExisting })
const stackUseExisting = new TestCommonStackUseExisting(
  appUseExisting,
  'test-api-destined-eb-use-existing-stack',
  testStackPropsUseExisting
)
const templateUseExisting = Template.fromStack(stackUseExisting)

describe('TestApiToEventBridgeTargetWithSns UseExisting', () => {
  test('is initialised as expected', () => {
    expect(stackUseExisting.props).toHaveProperty('region')
    expect(stackUseExisting.props.region).toEqual('eu-west-1')
  })

  test('synthesises with useExisting=true as expected', () => {
    /* With useExisting=true, most resources should NOT be created */
    templateUseExisting.resourceCountIs('AWS::Lambda::Function', 0)
    templateUseExisting.resourceCountIs('AWS::Events::Rule', 0)
    templateUseExisting.resourceCountIs('AWS::Events::EventBus', 0)
    templateUseExisting.resourceCountIs('AWS::ApiGateway::DomainName', 0)
    templateUseExisting.resourceCountIs('AWS::Route53::RecordSet', 0)
    templateUseExisting.resourceCountIs('AWS::ApiGateway::BasePathMapping', 0)
    /* With withResource=false, no topic, resource, or method */
    templateUseExisting.resourceCountIs('AWS::SNS::Topic', 0)
    templateUseExisting.resourceCountIs('AWS::ApiGateway::Resource', 0)
  })

  test('outputs as expected', () => {
    templateUseExisting.hasOutput('testHostedZoneHostedZoneId', {})
    templateUseExisting.hasOutput('testHostedZoneHostedZoneArn', {})
  })
})

/* Test with withResource: false - exercises all the withResource guard branches */
const testStackPropsNoResource = {
  apiRootPaths: [''],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/dummy.json',
    'packages/aws/test/common/cdkConfig/certificates.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/rules.json',
  ],
  name: 'test-api-to-eb-no-resource-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStackNoResource extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApiToEventBridgeTargetNoResource(this, testStackPropsNoResource.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          resource: 'notify',
          useExisting: false,
          withResource: false,
          restApi: {
            restApiName: 'test-destined-restapi-no-resource',
          },
        },
        apiRootPaths: this.node.tryGetContext('apiRootPaths'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
        event: {
          eventBusName: 'test-no-resource',
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

class TestApiToEventBridgeTargetNoResource extends ApiToEventBridgeTargetWithSns {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test'

    this.initResources()
  }
}

const appNoResource = new cdk.App({ context: testStackPropsNoResource })
const stackNoResource = new TestCommonStackNoResource(
  appNoResource,
  'test-api-destined-eb-no-resource-stack',
  testStackPropsNoResource
)
const templateNoResource = Template.fromStack(stackNoResource)

describe('TestApiToEventBridgeTargetWithSns NoResource', () => {
  test('is initialised as expected', () => {
    expect(stackNoResource.props).toHaveProperty('region')
    expect(stackNoResource.props.region).toEqual('eu-west-1')
  })

  test('synthesises with withResource=false as expected', () => {
    /* With withResource=false, SNS topic, resource, and method should not be created */
    templateNoResource.resourceCountIs('AWS::SNS::Topic', 0)
    templateNoResource.resourceCountIs('AWS::ApiGateway::Resource', 0)
    templateNoResource.resourceCountIs('AWS::ApiGateway::Method', 1)
    /* But the rest API, lambda, event bus, and rules should still be created */
    templateNoResource.resourceCountIs('AWS::ApiGateway::RestApi', 1)
    templateNoResource.resourceCountIs('AWS::Lambda::Function', 2)
    templateNoResource.resourceCountIs('AWS::Events::EventBus', 1)
    templateNoResource.resourceCountIs('AWS::Events::Rule', 2)
    templateNoResource.resourceCountIs('AWS::ApiGateway::DomainName', 1)
    templateNoResource.resourceCountIs('AWS::Route53::RecordSet', 1)
  })

  test('provisions lambda function as expected', () => {
    templateNoResource.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'cdktest-test-api-destined-test',
      Handler: 'lambda.handler',
      MemorySize: 1024,
      Runtime: 'nodejs24.x',
      Timeout: 60,
    })
  })

  test('provisions event bus as expected', () => {
    templateNoResource.hasResourceProperties('AWS::Events::EventBus', {
      Name: 'cdktest-test-no-resource-test',
    })
  })
})

/* Test with useExisting=false, withResource=true, importedRestApiRootResourceRef, and custom integrationResponse */
const testStackPropsImportedRoot = {
  apiRootPaths: [''],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/dummy.json',
    'packages/aws/test/common/cdkConfig/certificates.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/rules.json',
  ],
  name: 'test-api-to-eb-imported-root-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStackImportedRoot extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApiToEventBridgeTargetImportedRoot(this, testStackPropsImportedRoot.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          importedRestApiRootResourceRef: 'test-imported-root-resource-id',
          integrationResponse: {
            responseTemplates: {
              'application/json': JSON.stringify({ message: 'Custom Response' }),
            },
            statusCode: '201',
          },
          resource: 'notify',
          useExisting: false,
          withResource: true,
          restApi: {
            restApiName: 'test-destined-restapi-imported',
          },
        },
        apiRootPaths: this.node.tryGetContext('apiRootPaths'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
        event: {
          eventBusName: 'test-imported',
          ruleFailure: this.node.tryGetContext('testAnotherLambdaRule'),
          ruleSuccess: this.node.tryGetContext('testLambdaRule'),
        },
        lambda: {
          function: this.node.tryGetContext('testApiDestinedLambda'),
          layerSource: new lambda.AssetCode('packages/aws/test/common/nodejs/lib'),
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

class TestApiToEventBridgeTargetImportedRoot extends ApiToEventBridgeTargetWithSns {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test'

    this.initResources()
  }
}

const appImportedRoot = new cdk.App({ context: testStackPropsImportedRoot })
const stackImportedRoot = new TestCommonStackImportedRoot(
  appImportedRoot,
  'test-api-destined-eb-imported-root-stack',
  testStackPropsImportedRoot
)
const templateImportedRoot = Template.fromStack(stackImportedRoot)

describe('TestApiToEventBridgeTargetWithSns ImportedRootResource+CustomIntegration', () => {
  test('is initialised as expected', () => {
    expect(stackImportedRoot.props).toHaveProperty('region')
    expect(stackImportedRoot.props.region).toEqual('eu-west-1')
  })

  test('synthesises with importedRootResource as expected', () => {
    /* Lambda and event resources should be created */
    templateImportedRoot.resourceCountIs('AWS::Lambda::Function', 2)
    templateImportedRoot.resourceCountIs('AWS::Events::Rule', 2)
    templateImportedRoot.resourceCountIs('AWS::Events::EventBus', 1)
    /* With importedRestApiRootResourceRef, the resource should still be created via fromResourceAttributes */
    templateImportedRoot.resourceCountIs('AWS::ApiGateway::Resource', 1)
    templateImportedRoot.resourceCountIs('AWS::SNS::Topic', 1)
    /* Lambda layer should be created */
    templateImportedRoot.resourceCountIs('AWS::Lambda::LayerVersion', 1)
  })

  test('provisions api gateway resource as expected', () => {
    templateImportedRoot.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'notify',
    })
  })
})
