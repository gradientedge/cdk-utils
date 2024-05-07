import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import { CommonStack, StaticSite, StaticSiteProps } from '../../../lib'

interface TestStackProps extends StaticSiteProps {
  testAttribute?: string
}

const testContext = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/aws/common/cdkConfig/dummy.json',
    'src/test/aws/common/cdkConfig/buckets.json',
    'src/test/aws/common/cdkConfig/certificates.json',
    'src/test/aws/common/cdkConfig/distributions.json',
    'src/test/aws/common/cdkConfig/function.json',
  ],
  name: 'test-static-site-stack',
  region: 'eu-west-1',
  siteCreateAltARecord: true,
  siteSubDomain: 'site',
  skipStageForARecords: true,
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestStaticSiteConstruct(this, testContext.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        siteAliases: [`${this.node.tryGetContext('siteSubDomain')}.${this.fullyQualifiedDomain()}`],
        siteBucket: this.node.tryGetContext('siteBucket'),
        siteCertificate: this.node.tryGetContext('siteCertificate'),
        siteCloudfrontFunctionProps: this.node.tryGetContext('testStaticSite'),
        siteCreateAltARecord: this.node.tryGetContext('siteCreateAltARecord'),
        siteDistribution: this.node.tryGetContext('siteDistribution'),
        siteLogBucket: this.node.tryGetContext('siteLogBucket'),
        siteRecordName: this.node.tryGetContext('siteSubDomain'),
        siteSource: s3deploy.Source.asset('src/test/aws/common/nodejs/lib'),
        siteSubDomain: this.node.tryGetContext('siteSubDomain'),
        pruneOnDeployment: this.node.tryGetContext('pruneOnDeployment'),
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
    this.s3Manager.createBucketFolders('test-folders', this, this.siteBucket, ['test1', 'test2'])
  }
}

const createStack = (
  context: typeof testContext | { pruneOnDeployment?: boolean }
): { stack: TestCommonStack; template: Template } => {
  const app = new cdk.App({ context })
  const stack = new TestCommonStack(app, 'test-static-site-stack', {
    stackName: 'test',
  })
  const template = Template.fromStack(stack)
  return { stack, template }
}

type TestTuple = [string, { stack: TestCommonStack; template: Template }, { Prune: boolean }]

describe.each<TestTuple>([
  ['default to prune when prune on deployment is not configured', createStack(testContext), { Prune: true }],
  [
    'prunes on deployment when configured to true',
    createStack({ ...testContext, pruneOnDeployment: true }),
    { Prune: true },
  ],
  [
    'does not prune on deployment when disabled',
    createStack({ ...testContext, pruneOnDeployment: false }),
    { Prune: false },
  ],
])('%# %s', (_name, { stack, template }, expected) => {
  describe('TestStaticSiteConstruct', () => {
    test('is initialised as expected', async () => {
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
      template.resourceCountIs('AWS::Route53::RecordSet', 1)
      template.resourceCountIs('AWS::Lambda::Function', 3)
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 2)
      template.resourceCountIs('Custom::CDKBucketDeployment', 3)
      template.resourceCountIs('AWS::CloudFront::Function', 1)
    })
  })

  describe('TestStaticSiteConstruct', () => {
    test('disable pruning through properties', () => {
      // const stack = new TestCommonStack(app, 'test-static-site-stack', { ...testStackProps, )
      // const template = Template.fromStack(stack)
      // /* test if number of resources are correctly synthesised */
      // template.resourceCountIs('AWS::Route53::HostedZone', 1)
      // template.resourceCountIs('AWS::S3::Bucket', 2)
      // template.resourceCountIs('AWS::CloudFront::Distribution', 1)
      // template.resourceCountIs('AWS::Route53::RecordSet', 1)
      // template.resourceCountIs('AWS::Lambda::Function', 3)
      // template.resourceCountIs('Custom::S3AutoDeleteObjects', 2)
      // template.resourceCountIs('Custom::CDKBucketDeployment', 3)
      // template.resourceCountIs('AWS::CloudFront::Function', 1)
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
          Aliases: ['site.test.gradientedge.io'],
          Comment: 'test-static-site-distribution - test stage',
          DefaultCacheBehavior: {
            CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
            Compress: true,
            FunctionAssociations: [
              {
                EventType: 'viewer-request',
                FunctionARN: {
                  'Fn::GetAtt': ['teststaticsitestackteststaticsitefunction9EE64F2F', 'FunctionARN'],
                },
              },
            ],
            TargetOriginId: 'teststaticsitestackteststaticsitedistributionOrigin17FDFDB75',
            ViewerProtocolPolicy: 'redirect-to-https',
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
    })
  })

  describe('TestStaticSiteConstruct', () => {
    test('provisions cloudfront function as expected', () => {
      template.hasResourceProperties('AWS::CloudFront::Function', {
        FunctionConfig: {
          Comment: 'test comment',
        },
        Name: 'test-static-function-test',
      })
    })
  })

  describe('TestStaticSiteConstruct', () => {
    test('defaults to prune', () => {
      template.hasResourceProperties('Custom::CDKBucketDeployment', expected)
    })
  })
})
