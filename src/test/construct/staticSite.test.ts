import * as cdk from 'aws-cdk-lib'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import { Template } from 'aws-cdk-lib/assertions'
import { StaticSiteProps } from '../../lib/types'
import { CommonStack } from '../../lib/common/commonStack'
import { StaticSite } from '../../lib/construct/staticSite'

interface TestStackProps extends StaticSiteProps {
  testAttribute?: string
}

const testStackProps = {
  name: 'test-static-site-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stage: 'test',
  stackName: 'test',
  siteSubDomain: 'site',
  siteCreateAltARecord: true,
  extraContexts: [
    'src/test/common/cdkConfig/dummy.json',
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

    this.construct = new TestStaticSiteConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        siteCertificate: this.node.tryGetContext('siteCertificate'),
        siteBucket: this.node.tryGetContext('siteBucket'),
        siteLogBucket: this.node.tryGetContext('siteLogBucket'),
        siteDistribution: this.node.tryGetContext('siteDistribution'),
        siteSource: s3deploy.Source.asset('src/test/common/nodejs/lib'),
        siteRecordName: this.node.tryGetContext('siteSubDomain'),
        siteSubDomain: this.node.tryGetContext('siteSubDomain'),
        siteCreateAltARecord: this.node.tryGetContext('siteCreateAltARecord'),
        siteAliases: [`${this.node.tryGetContext('siteSubDomain')}.${this.fullyQualifiedDomain()}`],
        testAttribute: this.node.tryGetContext('testAttribute'),
      },
    }
  }
}

class TestStaticSiteConstruct extends StaticSite {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test-static-site'

    this.initResources()
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-static-site-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestStaticSiteConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })
})

describe('TestStaticSiteConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 1)
    template.resourceCountIs('AWS::S3::Bucket', 2)
    template.resourceCountIs('Custom::S3AutoDeleteObjects', 2)
    template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1)
    template.resourceCountIs('AWS::CloudFront::Distribution', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 2)
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('Custom::CDKBucketDeployment', 1)
  })
})

describe('TestStaticSiteConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testStaticSiteHostedZoneHostedZoneId', {})
    template.hasOutput('testStaticSiteHostedZoneHostedZoneArn', {})
    template.hasOutput('testStaticSiteCertificateCertificateArn', {})
    template.hasOutput('testStaticSiteSiteLogsBucketName', {})
    template.hasOutput('testStaticSiteSiteLogsBucketArn', {})
    template.hasOutput('testStaticSiteSiteBucketName', {})
    template.hasOutput('testStaticSiteSiteBucketArn', {})
    template.hasOutput('testStaticSiteDistributionDistributionId', {})
    template.hasOutput('testStaticSiteDistributionDistributionDomainName', {})
    template.hasOutput('testStaticSiteDomainARecordARecordDomainName', {})
  })
})

describe('TestStaticSiteConstruct', () => {
  test('provisions site log bucket as expected', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      AccessControl: 'LogDeliveryWrite',
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      BucketName: 'site-logs-test.test.gradientedge.io',
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    })
  })
})

describe('TestStaticSiteConstruct', () => {
  test('provisions site bucket as expected', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      AccessControl: 'Private',
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      BucketName: 'site-test.test.gradientedge.io',
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    })
  })
})

describe('TestStaticSiteConstruct', () => {
  test('provisions site distribution as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Comment: 'test-static-site-distribution - test',
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
          AcmCertificateArn: {
            'Fn::Join': [
              '',
              [
                'arn:aws:acm:us-east-1:',
                {
                  Ref: 'AWS::AccountId',
                },
                ':certificate/12345a67-8f85-46da-8441-88c998b4bd64',
              ],
            ],
          },
          MinimumProtocolVersion: 'TLSv1.1_2016',
          SslSupportMethod: 'sni-only',
        },
      },
    })
  })
})

describe('TestStaticSiteConstruct', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'site.test.gradientedge.io.',
      Type: 'A',
    })
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'site-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})
