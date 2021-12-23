import * as cdk from 'aws-cdk-lib'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import { Template } from 'aws-cdk-lib/assertions'
import { StaticSiteWithLambdaEdgeProps } from '../../lib/types'
import { CommonStack } from '../../lib/common/commonStack'
import { StaticSiteWithLambdaEdge } from '../../lib/construct/staticSiteWithLambdaEdge'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'

interface TestStackProps extends StaticSiteWithLambdaEdgeProps {
  testAttribute?: string
  siteEdgeLambda: any
}

const testStackProps = {
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
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
    'src/test/common/cdkConfig/lambdas.json',
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
        siteEdgeDistribution: this.node.tryGetContext('testEdgeDistribution'),
        siteSource: s3deploy.Source.asset('src/test/common/nodejs/lib'),
        siteRecordName: this.node.tryGetContext('siteSubDomain'),
        siteSubDomain: this.node.tryGetContext('siteSubDomain'),
        siteCreateAltARecord: this.node.tryGetContext('siteCreateAltARecord'),
        siteEdgeLambda: this.node.tryGetContext('testLambdaEdge'),
        siteEdgeLambdaSource: new lambda.AssetCode('src/test/common/nodejs/lib'),
        testAttribute: this.node.tryGetContext('testAttribute'),
      },
    }
  }
}

class TestStaticSiteConstruct extends StaticSiteWithLambdaEdge {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props

    this.id = 'test-static-site'

    this.initResources()
    const siteEdgeLambdaFunction = this.lambdaManager.createEdgeFunction(
      'test-lambda-edge',
      this,
      this.props.siteEdgeLambda,
      [],
      new lambda.AssetCode('src/test/common/nodejs/lib')
    )
    this.siteDistribution.addBehavior('product/*', this.siteOrigin, {
      edgeLambdas: [
        {
          functionVersion: siteEdgeLambdaFunction.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
        },
      ],
    })
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-static-site-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestStaticSiteLambdaEdgeConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })
})

describe('TestStaticSiteLambdaEdgeConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 1)
    template.resourceCountIs('AWS::S3::Bucket', 2)
    template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1)
    template.resourceCountIs('AWS::CloudFront::Distribution', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 2)
    template.resourceCountIs('AWS::Lambda::Function', 3)
    template.resourceCountIs('Custom::S3AutoDeleteObjects', 2)
    template.resourceCountIs('Custom::CDKBucketDeployment', 1)
  })
})

describe('TestStaticSiteLambdaEdgeConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testStaticSiteHostedZoneHostedZoneId', {})
    template.hasOutput('testStaticSiteHostedZoneHostedZoneArn', {})
    template.hasOutput('testStaticSiteCertificateCertificateArn', {})
    template.hasOutput('testStaticSiteSiteLogsBucketName', {})
    template.hasOutput('testStaticSiteSiteLogsBucketArn', {})
    template.hasOutput('testStaticSiteSiteBucketName', {})
    template.hasOutput('testStaticSiteSiteBucketArn', {})
    template.hasOutput('testLambdaEdgeEdgeArn', {})
    template.hasOutput('testLambdaEdgeEdgeFunctionArn', {})
    template.hasOutput('testLambdaEdgeEdgeFunctionName', {})
    template.hasOutput('testStaticSiteDistributionDistributionId', {})
    template.hasOutput('testStaticSiteDistributionDistributionDomainName', {})
    template.hasOutput('testStaticSiteDomainARecordARecordDomainName', {})
    template.hasOutput('testStaticSiteDomainARecordAltARecordDomainName', {})
  })
})

describe('TestStaticSiteLambdaEdgeConstruct', () => {
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

describe('TestStaticSiteLambdaEdgeConstruct', () => {
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

describe('TestStaticSiteLambdaEdgeConstruct', () => {
  test('provisions site distribution as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: [
          {
            Ref: 'teststaticsitestackteststaticsitesitebucketDBC08543',
          },
        ],
        CacheBehaviors: [
          {
            CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
            Compress: true,
            LambdaFunctionAssociations: [
              {
                EventType: 'origin-request',
                LambdaFunctionARN: {
                  'Fn::GetAtt': ['teststaticsitestacktestlambdaedgeArnReaderA8FDCBA5', 'FunctionArn'],
                },
              },
            ],
            PathPattern: 'product/*',
            TargetOriginId: 'teststaticsitestackteststaticsitedistributionOrigin17FDFDB75',
            ViewerProtocolPolicy: 'allow-all',
          },
        ],
        Comment: 'test-static-site-distribution - test stage',
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
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
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
          AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789:certificate/12345a67-8f85-46da-8441-88c998b4bd64',
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SslSupportMethod: 'sni-only',
        },
      },
    })
  })
})

describe('TestStaticSiteLambdaEdgeConstruct', () => {
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
