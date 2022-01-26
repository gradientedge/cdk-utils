import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import { StaticSite } from '../../lib/construct/staticSite'
import * as types from '../../lib/types'

interface TestStackProps extends types.StaticSiteProps {
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
    'src/test/common/cdkConfig/function.json',
  ],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends common.CommonStack {
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
        siteCloudfrontFunctionProps: this.node.tryGetContext('testStaticSite'),
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
    template.resourceCountIs('AWS::CloudFront::Distribution', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 2)
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('Custom::S3AutoDeleteObjects', 2)
    template.resourceCountIs('Custom::CDKBucketDeployment', 1)
    template.resourceCountIs('AWS::CloudFront::Function', 1)
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
        Aliases: [
          'site.test.gradientedge.io',
          {
            Ref: 'teststaticsitestackteststaticsitesitebucketDBC08543',
          },
        ],
        Comment: 'test-static-site-distribution - test stage',
        DefaultCacheBehavior: {
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
          FunctionAssociations: [
            {
              EventType: 'viewer-request',
              FunctionARN: {
                'Fn::GetAtt': ['teststaticsitestackteststaticsitefunction9EE64F2F', 'FunctionARN'],
              },
            },
          ],
          Compress: true,
          TargetOriginId: 'teststaticsitestackteststaticsitedistributionOrigin17FDFDB75',
          ViewerProtocolPolicy: 'allow-all',
        },
        Enabled: true,
        HttpVersion: 'http2',
        IPV6Enabled: true,
        Logging: {
          Bucket: {
            'Fn::GetAtt': ['teststaticsitestackteststaticsitesitelogsbucket7DECDDDE', 'RegionalDomainName'],
          },
          IncludeCookies: true,
          Prefix: 'edge/',
        },
        Origins: [
          {
            CustomOriginConfig: {
              OriginProtocolPolicy: 'http-only',
              OriginSSLProtocols: ['TLSv1.2'],
            },
            DomainName: {
              'Fn::Select': [
                2,
                {
                  'Fn::Split': [
                    '/',
                    {
                      'Fn::GetAtt': ['teststaticsitestackteststaticsitesitebucketDBC08543', 'WebsiteURL'],
                    },
                  ],
                },
              ],
            },
            Id: 'teststaticsitestackteststaticsitedistributionOrigin17FDFDB75',
          },
        ],
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
          MinimumProtocolVersion: 'TLSv1.2_2021',
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

describe('TestStaticSiteConstruct', () => {
  test('provisions cloudfront function as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Function', {
      Name: 'test-static-function-test',
      FunctionConfig: {
        Comment: 'test comment',
      },
    })
  })
})
