import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { AssetCode } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonStack, SiteWithLambdaBackend, SiteWithLambdaBackendProps } from '../../src/index.js'

interface TestStackProps extends SiteWithLambdaBackendProps {
  testAttribute?: string
}

/* Test with certificate SSM resolution, response headers policy, and skipStageForARecords */
const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/dummy.json',
    'packages/aws/test/common/cdkConfig/buckets.json',
    'packages/aws/test/common/cdkConfig/cachePolicies.json',
    'packages/aws/test/common/cdkConfig/certificates.json',
    'packages/aws/test/common/cdkConfig/distributions.json',
    'packages/aws/test/common/cdkConfig/function.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/logs.json',
    'packages/aws/test/common/cdkConfig/requestPolicies.json',
  ],
  name: 'test-site-variant-stack',
  region: 'eu-west-1',
  siteCreateAltARecord: true,
  siteSubDomain: 'site',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestSiteWithLambdaBackend(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      logLevel: this.node.tryGetContext('logLevel'),
      nodeEnv: this.node.tryGetContext('nodeEnv'),
      siteAliases: [`${this.node.tryGetContext('siteSubDomain')}.${this.fullyQualifiedDomain()}`],
      siteCachePolicy: this.node.tryGetContext('siteCachePolicy'),
      siteCertificate: {
        ...this.node.tryGetContext('siteCertificate'),
        certificateSsmName: '/certs/site-certificate-arn',
        certificateRegion: 'us-east-1',
      },
      siteDistribution: this.node.tryGetContext('siteDistribution'),
      siteExecWrapperPath: '/opt/bootstrap',
      siteHealthEndpoint: '/api/health',
      siteLambda: this.node.tryGetContext('siteLambda'),
      siteLog: this.node.tryGetContext('testLogGroup'),
      siteLogBucket: this.node.tryGetContext('siteLogBucket'),
      siteOriginRequestPolicy: this.node.tryGetContext('siteOriginRequestPolicy'),
      siteOriginResponseHeadersPolicy: {
        responseHeadersPolicyName: 'test-response-headers-policy',
        type: 'origin',
        securityHeadersBehavior: {
          strictTransportSecurity: {
            accessControlMaxAgeInSeconds: 63072000,
            includeSubdomains: true,
            override: true,
            preload: true,
          },
        },
      },
      sitePort: '4000',
      siteRecordName: this.node.tryGetContext('siteSubDomain'),
      siteRegionalCertificate: {
        certificateArn: 'arn:aws:acm:eu-west-1:123456789:certificate/12345a67-8f85-46da-8441-88c998b4bd64',
        certificateRegion: 'eu-west-1',
        certificateSsmName: '/certs/regional-certificate-arn',
        domainName: this.fullyQualifiedDomain(),
        subjectAlternativeNames: [`*.${this.fullyQualifiedDomain()}`],
        useExistingCertificate: true,
      },
      siteSubDomain: this.node.tryGetContext('siteSubDomain'),
      skipStageForARecords: true,
      testAttribute: this.node.tryGetContext('testAttribute'),
      timezone: this.node.tryGetContext('timezone'),
      useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
    }
  }
}

class TestSiteWithLambdaBackend extends SiteWithLambdaBackend {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props
    this.id = 'test-site'
    this.initResources()
  }

  protected createSiteLambdaApplication() {
    this.siteLambdaApplication = AssetCode.fromAsset('packages/aws/test/common/nodejs/lib')
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-site-variant-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestSiteWithLambdaBackendConstruct Variants', () => {
  test('is initialised as expected', () => {
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })

  test('synthesises as expected', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 1)
    template.resourceCountIs('AWS::CloudFront::CachePolicy', 1)
    template.resourceCountIs('AWS::CloudFront::OriginRequestPolicy', 1)
    template.resourceCountIs('AWS::CloudFront::ResponseHeadersPolicy', 1)
    template.resourceCountIs('AWS::Lambda::Function', 3)
    template.resourceCountIs('AWS::Lambda::Url', 1)
  })

  test('provisions response headers policy as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
      ResponseHeadersPolicyConfig: {
        Name: 'cdktest-test-response-headers-policy-test',
      },
    })
  })

  test('provisions distribution with skipStageForARecords', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['site.test.gradientedge.io'],
      },
    })
  })
})

/* Test without cloudfront function and without cache invalidation - exercises the false branches */
const testStackPropsNoFn = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/dummy.json',
    'packages/aws/test/common/cdkConfig/buckets.json',
    'packages/aws/test/common/cdkConfig/certificates.json',
    'packages/aws/test/common/cdkConfig/distributions.json',
    'packages/aws/test/common/cdkConfig/lambdas.json',
    'packages/aws/test/common/cdkConfig/logs.json',
  ],
  name: 'test-site-no-fn-stack',
  region: 'eu-west-1',
  siteCreateAltARecord: true,
  siteSubDomain: 'site',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStackNoFn extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestSiteWithLambdaBackendNoFn(this, testStackPropsNoFn.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      logLevel: this.node.tryGetContext('logLevel'),
      nodeEnv: this.node.tryGetContext('nodeEnv'),
      siteAliases: [`${this.node.tryGetContext('siteSubDomain')}.${this.fullyQualifiedDomain()}`],
      siteCertificate: this.node.tryGetContext('siteCertificate'),
      siteDistribution: this.node.tryGetContext('siteDistribution'),
      siteExecWrapperPath: '/opt/bootstrap',
      siteHealthEndpoint: '/api/health',
      siteLambda: this.node.tryGetContext('siteLambda'),
      siteLog: this.node.tryGetContext('testLogGroup'),
      siteLogBucket: this.node.tryGetContext('siteLogBucket'),
      sitePort: '4000',
      siteRecordName: this.node.tryGetContext('siteSubDomain'),
      siteRegionalCertificate: {
        domainName: this.fullyQualifiedDomain(),
        subjectAlternativeNames: [`*.${this.fullyQualifiedDomain()}`],
        useExistingCertificate: false,
      },
      siteSubDomain: this.node.tryGetContext('siteSubDomain'),
      testAttribute: this.node.tryGetContext('testAttribute'),
      timezone: this.node.tryGetContext('timezone'),
      useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
    }
  }
}

class TestSiteWithLambdaBackendNoFn extends SiteWithLambdaBackend {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props
    this.id = 'test-site'
    this.initResources()
  }

  protected createSiteLambdaApplication() {
    this.siteLambdaApplication = AssetCode.fromAsset('packages/aws/test/common/nodejs/lib')
  }
}

const appNoFn = new cdk.App({ context: testStackPropsNoFn })
const stackNoFn = new TestCommonStackNoFn(appNoFn, 'test-site-no-fn-stack', testStackPropsNoFn)
const templateNoFn = Template.fromStack(stackNoFn)

describe('TestSiteWithLambdaBackendConstruct NoFn', () => {
  test('synthesises without cloudfront function and cache invalidation', () => {
    templateNoFn.resourceCountIs('AWS::CloudFront::Function', 0)
    templateNoFn.resourceCountIs('AWS::CodeBuild::Project', 0)
    templateNoFn.resourceCountIs('AWS::CloudFront::Distribution', 1)
    templateNoFn.resourceCountIs('AWS::CloudFront::CachePolicy', 0)
    templateNoFn.resourceCountIs('AWS::CloudFront::OriginRequestPolicy', 0)
    templateNoFn.resourceCountIs('AWS::CloudFront::ResponseHeadersPolicy', 0)
  })
})
