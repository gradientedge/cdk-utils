import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { ApiToLambdaTarget, ApiToLambdaTargetProps, CommonStack } from '../../src/index.js'

interface TestStackProps extends ApiToLambdaTargetProps {
  testLambda: any
}

/* Test with useExisting: true - exercises the early-return branches */
const testStackPropsUseExisting = {
  apiRootPaths: ['create-order'],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/apiConfigs.json',
    'packages/aws/test/common/cdkConfig/dummy.json',
    'packages/aws/test/common/cdkConfig/certificates.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/rules.json',
  ],
  name: 'test-api-to-lambda-use-existing-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStackUseExisting extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApiToLambdaTargetUseExisting(this, testStackPropsUseExisting.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          importedRestApiRef: 'test-imported-rest-api-id',
          importedRestApiRootResourceRef: 'test-imported-root-resource-id',
          resource: 'my-resource',
          restApi: this.node.tryGetContext('testRestApi'),
          useExisting: true,
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

class TestApiToLambdaTargetUseExisting extends ApiToLambdaTarget {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test'

    const testLayer = this.lambdaManager.createLambdaLayer(
      'test-lambda-layer',
      this,
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
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
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
    )

    this.initResources()
  }
}

const appUseExisting = new cdk.App({ context: testStackPropsUseExisting })
const stackUseExisting = new TestCommonStackUseExisting(
  appUseExisting,
  'test-api-to-lambda-use-existing-stack',
  testStackPropsUseExisting
)
const templateUseExisting = Template.fromStack(stackUseExisting)

describe('TestApiToLambdaTarget UseExisting', () => {
  test('is initialised as expected', () => {
    expect(stackUseExisting.props).toHaveProperty('region')
    expect(stackUseExisting.props.region).toEqual('eu-west-1')
  })

  test('synthesises with useExisting=true as expected', () => {
    /* With useExisting=true, domain, base path mapping, route53 should NOT be created */
    templateUseExisting.resourceCountIs('AWS::ApiGateway::DomainName', 0)
    templateUseExisting.resourceCountIs('AWS::ApiGateway::BasePathMapping', 0)
    templateUseExisting.resourceCountIs('AWS::Route53::RecordSet', 0)
    /* Rest API should be imported */
    templateUseExisting.resourceCountIs('AWS::ApiGateway::RestApi', 0)
    /* Resource and methods should still be created */
    templateUseExisting.resourceCountIs('AWS::ApiGateway::Resource', 1)
    templateUseExisting.resourceCountIs('AWS::ApiGateway::Method', 1)
    templateUseExisting.resourceCountIs('AWS::IAM::Role', 2)
  })

  test('provisions api gateway resource as expected', () => {
    templateUseExisting.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'my-resource',
    })
  })

  test('outputs as expected', () => {
    templateUseExisting.hasOutput('testHostedZoneHostedZoneId', {})
    templateUseExisting.hasOutput('testHostedZoneHostedZoneArn', {})
  })
})

/* Test with useExisting: true and withResource: false - exercises all early-return branches */
const testStackPropsUseExistingNoResource = {
  apiRootPaths: ['create-order'],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/apiConfigs.json',
    'packages/aws/test/common/cdkConfig/dummy.json',
    'packages/aws/test/common/cdkConfig/certificates.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/rules.json',
  ],
  name: 'test-api-to-lambda-use-existing-no-resource-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStackUseExistingNoResource extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApiToLambdaTargetUseExistingNoResource(
      this,
      testStackPropsUseExistingNoResource.name,
      this.props
    )
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          importedRestApiRef: 'test-imported-rest-api-id',
          resource: 'my-resource',
          restApi: this.node.tryGetContext('testRestApi'),
          useExisting: true,
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

class TestApiToLambdaTargetUseExistingNoResource extends ApiToLambdaTarget {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test'

    const testLayer = this.lambdaManager.createLambdaLayer(
      'test-lambda-layer',
      this,
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
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
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
    )

    this.initResources()
  }
}

const appUseExistingNoResource = new cdk.App({ context: testStackPropsUseExistingNoResource })
const stackUseExistingNoResource = new TestCommonStackUseExistingNoResource(
  appUseExistingNoResource,
  'test-api-to-lambda-use-existing-no-resource-stack',
  testStackPropsUseExistingNoResource
)
const templateUseExistingNoResource = Template.fromStack(stackUseExistingNoResource)

describe('TestApiToLambdaTarget UseExisting+NoResource', () => {
  test('is initialised as expected', () => {
    expect(stackUseExistingNoResource.props).toHaveProperty('region')
    expect(stackUseExistingNoResource.props.region).toEqual('eu-west-1')
  })

  test('synthesises with useExisting=true and withResource=false as expected', () => {
    /* With both flags, no resource, method, domain, or route53 */
    templateUseExistingNoResource.resourceCountIs('AWS::ApiGateway::Resource', 0)
    templateUseExistingNoResource.resourceCountIs('AWS::ApiGateway::Method', 0)
    templateUseExistingNoResource.resourceCountIs('AWS::ApiGateway::RestApi', 0)
    templateUseExistingNoResource.resourceCountIs('AWS::ApiGateway::DomainName', 0)
    templateUseExistingNoResource.resourceCountIs('AWS::Route53::RecordSet', 0)
    templateUseExistingNoResource.resourceCountIs('AWS::ApiGateway::BasePathMapping', 0)
  })
})

/* Test with useExisting=true and importedRestApiRootResourceRef */
const testStackPropsImportedRoot = {
  apiRootPaths: ['create-order'],
  apiSubDomain: 'api',
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/apiConfigs.json',
    'packages/aws/test/common/cdkConfig/dummy.json',
    'packages/aws/test/common/cdkConfig/certificates.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/rules.json',
  ],
  name: 'test-api-to-lambda-imported-root-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStackImportedRoot extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestApiToLambdaTargetImportedRoot(this, testStackPropsImportedRoot.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        api: {
          certificate: this.node.tryGetContext('siteCertificate'),
          importedRestApiRef: 'test-imported-rest-api-id',
          importedRestApiRootResourceRef: 'test-imported-root-resource-id',
          resource: 'my-resource',
          restApi: this.node.tryGetContext('testRestApi'),
          useExisting: true,
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

class TestApiToLambdaTargetImportedRoot extends ApiToLambdaTarget {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test'

    const testLayer = this.lambdaManager.createLambdaLayer(
      'test-lambda-layer',
      this,
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
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
      new lambda.AssetCode('packages/aws/test/common/nodejs/lib')
    )

    this.initResources()
  }
}

const appImportedRoot = new cdk.App({ context: testStackPropsImportedRoot })
const stackImportedRoot = new TestCommonStackImportedRoot(
  appImportedRoot,
  'test-api-to-lambda-imported-root-stack',
  testStackPropsImportedRoot
)
const templateImportedRoot = Template.fromStack(stackImportedRoot)

describe('TestApiToLambdaTarget ImportedRoot', () => {
  test('is initialised as expected', () => {
    expect(stackImportedRoot.props).toHaveProperty('region')
    expect(stackImportedRoot.props.region).toEqual('eu-west-1')
  })

  test('synthesises with importedRestApiRootResourceRef as expected', () => {
    /* With importedRootResource, resources should still be created via fromResourceAttributes */
    templateImportedRoot.resourceCountIs('AWS::ApiGateway::Resource', 1)
    templateImportedRoot.resourceCountIs('AWS::ApiGateway::Method', 1)
    templateImportedRoot.resourceCountIs('AWS::ApiGateway::RestApi', 0)
    templateImportedRoot.resourceCountIs('AWS::ApiGateway::DomainName', 0)
  })

  test('provisions api gateway resource as expected', () => {
    templateImportedRoot.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'my-resource',
    })
  })
})
