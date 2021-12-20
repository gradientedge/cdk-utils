import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Template } from 'aws-cdk-lib/assertions'
import { CommonStackProps } from '../../lib/types'
import { CommonConstruct } from '../../lib/common/commonConstruct'
import { CommonStack } from '../../lib/common/commonStack'

interface TestStackProps extends CommonStackProps {
  testBucket: any
  testLogBucket: any
  testCertificate: any
  testDistribution: any
}

const testStackProps = {
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  name: 'test-common-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  extraContexts: [
    'src/test/common/cdkConfig/buckets.json',
    'src/test/common/cdkConfig/certificates.json',
    'src/test/common/cdkConfig/distributions.json',
  ],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testBucket: this.node.tryGetContext('siteBucket'),
        testLogBucket: this.node.tryGetContext('siteLogBucket'),
        testCertificate: this.node.tryGetContext('siteCertificate'),
        testDistribution: this.node.tryGetContext('siteDistribution'),
      },
    }
  }
}

class TestInvalidCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testBucket: this.node.tryGetContext('siteBucket'),
        testLogBucket: this.node.tryGetContext('siteLogBucket'),
        testCertificate: this.node.tryGetContext('siteCertificate'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const siteBucket = this.s3Manager.createS3Bucket('test-bucket', this, this.props.testBucket)
    const siteLogBucket = this.s3Manager.createS3Bucket('test-log-bucket', this, this.props.testLogBucket)
    const oai = this.cloudFrontManager.createOriginAccessIdentity('test-oai-bucket', this, siteBucket)
    const certificate = this.acmManager.resolveCertificate('test-certificate', this, this.props.testCertificate)
    this.cloudFrontManager.createCloudFrontDistribution(
      'test-distribution',
      this,
      this.props.testDistribution,
      siteBucket,
      siteLogBucket,
      oai,
      certificate
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestCloudFrontConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('CloudFront props undefined')
  })
})

describe('TestCloudFrontConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props.testDistribution.errorConfigurations[0].errorCode).toEqual(403)
    expect(commonStack.props.testDistribution.errorConfigurations[0].responseCode).toEqual(200)
  })
})

describe('TestCloudFrontConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::CloudFront::Distribution', 1)
  })
})

describe('TestCloudFrontConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testDistributionDistributionId', {})
    template.hasOutput('testDistributionDistributionDomainName', {})
  })
})

describe('TestCloudFrontConstruct', () => {
  test('provisions new distribution as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Comment: 'test-distribution - test',
        CustomErrorResponses: [
          {
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/server/pages/index.html',
          },
          {
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/server/pages/index.html',
          },
        ],
        DefaultCacheBehavior: {
          AllowedMethods: ['GET', 'HEAD'],
          CachedMethods: ['GET', 'HEAD'],
          Compress: true,
          ForwardedValues: {
            Cookies: {
              Forward: 'none',
            },
            QueryString: false,
          },
          ViewerProtocolPolicy: 'redirect-to-https',
        },
        DefaultRootObject: 'index.html',
        Enabled: true,
        HttpVersion: 'http2',
        IPV6Enabled: true,
        Logging: {
          IncludeCookies: false,
          Prefix: 'cloudfront/',
        },
        PriceClass: 'PriceClass_All',
        ViewerCertificate: {
          AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789:certificate/12345a67-8f85-46da-8441-88c998b4bd64',
          MinimumProtocolVersion: 'TLSv1.1_2016',
          SslSupportMethod: 'sni-only',
        },
      },
    })
  })
})
