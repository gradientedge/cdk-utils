import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as appscaling from 'aws-cdk-lib/aws-applicationautoscaling'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import { CommonStack, SiteWithEcsBackend, SiteWithEcsBackendProps } from '../../src/index.js'

interface TestStackProps extends SiteWithEcsBackendProps {
  testAttribute?: string
}

/* Test with scaling, origin request policy, response headers policy, and useExistingVpc=true */
const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'packages/aws/test/common/cdkConfig/dummy.json',
    'packages/aws/test/common/cdkConfig/buckets.json',
    'packages/aws/test/common/cdkConfig/certificates.json',
    'packages/aws/test/common/cdkConfig/clusters.json',
    'packages/aws/test/common/cdkConfig/distributions.json',
    'packages/aws/test/common/cdkConfig/function.json',
    'packages/aws/test/common/cdkConfig/healthCheck.json',
    'packages/aws/test/common/cdkConfig/logs.json',
    'packages/aws/test/common/cdkConfig/tasks.json',
    'packages/aws/test/common/cdkConfig/vpc.json',
    'packages/aws/test/common/cdkConfig/cachePolicies.json',
    'packages/aws/test/common/cdkConfig/requestPolicies.json',
  ],
  name: 'test-site-scaling-stack',
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

    this.construct = new TestSiteWithEcsBackendConstruct(this, testStackProps.name, this.props)
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
      siteCluster: this.node.tryGetContext('testCluster'),
      siteDistribution: this.node.tryGetContext('siteDistribution'),
      siteEcsContainerImagePath: `packages/aws/test/common/docker`,
      siteHealthCheck: this.node.tryGetContext('siteHealthCheck'),
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
      siteRecordName: this.node.tryGetContext('siteSubDomain'),
      siteRegionalCertificate: {
        certificateArn: 'arn:aws:acm:eu-west-1:123456789:certificate/12345a67-8f85-46da-8441-88c998b4bd64',
        certificateRegion: 'eu-west-1',
        certificateSsmName: '/certs/regional-certificate-arn',
        domainName: this.fullyQualifiedDomain(),
        subjectAlternativeNames: [`*.${this.fullyQualifiedDomain()}`],
        useExistingCertificate: true,
      },
      siteSource: s3deploy.Source.asset('packages/aws/test/common/nodejs/lib'),
      siteSubDomain: this.node.tryGetContext('siteSubDomain'),
      siteTask: {
        ...this.node.tryGetContext('testTask'),
        siteScaling: {
          maxCapacity: 8,
          minCapacity: 2,
          scaleOnCpuUtilization: 70,
          scaleOnMemoryUtilization: 80,
          scaleOnRequestsPerTarget: 5000,
          scaleOnSchedule: {
            schedule: appscaling.Schedule.cron({ hour: '8', minute: '0' }),
            minCapacity: 4,
          },
        },
      },
      siteVpc: this.node.tryGetContext('testVpc'),
      testAttribute: this.node.tryGetContext('testAttribute'),
      timezone: this.node.tryGetContext('timezone'),
      useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
    }
  }
}

class TestSiteWithEcsBackendConstruct extends SiteWithEcsBackend {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test-site'

    this.initResources()
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-site-scaling-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestSiteWithEcsBackendConstruct Scaling', () => {
  test('is initialised as expected', () => {
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })

  test('synthesises as expected', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1)
    template.resourceCountIs('AWS::ECS::TaskDefinition', 1)
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1)
    template.resourceCountIs('AWS::CloudFront::Distribution', 1)
    template.resourceCountIs('AWS::CloudFront::CachePolicy', 1)
    template.resourceCountIs('AWS::CloudFront::OriginRequestPolicy', 1)
    template.resourceCountIs('AWS::CloudFront::ResponseHeadersPolicy', 1)
    /* Auto-scaling resources */
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 1)
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 3)
  })

  test('provisions auto-scaling target as expected', () => {
    template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
      MaxCapacity: 8,
      MinCapacity: 2,
    })
  })

  test('provisions origin request policy as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::OriginRequestPolicy', {
      OriginRequestPolicyConfig: {
        Comment: 'Request Policy for test-site-distribution - test stage',
        Name: 'cdktest-origin-request-policy-test',
      },
    })
  })

  test('provisions response headers policy as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
      ResponseHeadersPolicyConfig: {
        Name: 'cdktest-test-response-headers-policy-test',
      },
    })
  })

  test('provisions health check as expected', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckEnabled: true,
      HealthCheckIntervalSeconds: 30,
      HealthCheckPath: '/',
      HealthCheckTimeoutSeconds: 5,
    })
  })
})

/* Test without cloudfront function and without cache invalidation docker path */
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
    'packages/aws/test/common/cdkConfig/clusters.json',
    'packages/aws/test/common/cdkConfig/distributions.json',
    'packages/aws/test/common/cdkConfig/healthCheck.json',
    'packages/aws/test/common/cdkConfig/logs.json',
    'packages/aws/test/common/cdkConfig/tasks.json',
    'packages/aws/test/common/cdkConfig/vpc.json',
  ],
  name: 'test-site-no-fn-stack',
  region: 'eu-west-1',
  siteCreateAltARecord: true,
  siteSubDomain: 'site',
  skipStageForARecords: true,
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStackNoFn extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestSiteWithEcsBackendConstructNoFn(this, testStackPropsNoFn.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      logLevel: this.node.tryGetContext('logLevel'),
      nodeEnv: this.node.tryGetContext('nodeEnv'),
      siteAliases: [`${this.node.tryGetContext('siteSubDomain')}.${this.fullyQualifiedDomain()}`],
      siteCertificate: this.node.tryGetContext('siteCertificate'),
      siteCluster: this.node.tryGetContext('testCluster'),
      siteDistribution: this.node.tryGetContext('siteDistribution'),
      siteEcsContainerImagePath: `packages/aws/test/common/docker`,
      siteLog: this.node.tryGetContext('testLogGroup'),
      siteLogBucket: this.node.tryGetContext('siteLogBucket'),
      siteRecordName: this.node.tryGetContext('siteSubDomain'),
      siteRegionalCertificate: {
        domainName: this.fullyQualifiedDomain(),
        subjectAlternativeNames: [`*.${this.fullyQualifiedDomain()}`],
        useExistingCertificate: false,
      },
      siteSource: s3deploy.Source.asset('packages/aws/test/common/nodejs/lib'),
      siteSubDomain: this.node.tryGetContext('siteSubDomain'),
      siteTask: this.node.tryGetContext('testTask'),
      siteVpc: this.node.tryGetContext('testVpc'),
      skipStageForARecords: true,
      testAttribute: this.node.tryGetContext('testAttribute'),
      timezone: this.node.tryGetContext('timezone'),
      useExistingHostedZone: this.node.tryGetContext('useExistingHostedZone'),
    }
  }
}

class TestSiteWithEcsBackendConstructNoFn extends SiteWithEcsBackend {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test-site'

    this.initResources()
  }
}

const appNoFn = new cdk.App({ context: testStackPropsNoFn })
const stackNoFn = new TestCommonStackNoFn(appNoFn, 'test-site-no-fn-stack', testStackPropsNoFn)
const templateNoFn = Template.fromStack(stackNoFn)

describe('TestSiteWithEcsBackendConstruct NoFn', () => {
  test('synthesises without cloudfront function and without cache invalidation', () => {
    templateNoFn.resourceCountIs('AWS::CloudFront::Function', 0)
    templateNoFn.resourceCountIs('AWS::CodeBuild::Project', 0)
    templateNoFn.resourceCountIs('AWS::ECS::Cluster', 1)
    templateNoFn.resourceCountIs('AWS::CloudFront::Distribution', 1)
  })

  test('provisions distribution without function associations', () => {
    templateNoFn.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['site.test.gradientedge.io'],
      },
    })
  })
})
