import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonStack, SiteWithLambdaBackend, SiteWithLambdaBackendProps } from '../../../lib'
import { AssetCode } from 'aws-cdk-lib/aws-lambda'

interface TestStackProps extends SiteWithLambdaBackendProps {
  testAttribute?: string
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'src/test/aws/common/cdkConfig/dummy.json',
    'src/test/aws/common/cdkConfig/buckets.json',
    'src/test/aws/common/cdkConfig/cachePolicies.json',
    'src/test/aws/common/cdkConfig/certificates.json',
    'src/test/aws/common/cdkConfig/distributions.json',
    'src/test/aws/common/cdkConfig/function.json',
    'src/test/aws/common/cdkConfig/lambdas.json',
    'src/test/aws/common/cdkConfig/logs.json',
    'src/test/aws/common/cdkConfig/requestPolicies.json',
  ],
  name: 'test-site-stack',
  region: 'eu-west-1',
  siteCreateAltARecord: true,
  siteSubDomain: 'site',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
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
      siteCacheInvalidationDockerFilePath: `src/test/aws/common/docker`,
      siteCachePolicy: this.node.tryGetContext('siteCachePolicy'),
      siteCertificate: this.node.tryGetContext('siteCertificate'),
      siteCloudfrontFunctionProps: this.node.tryGetContext('testSite'),
      siteDistribution: this.node.tryGetContext('siteDistribution'),
      siteExecWrapperPath: '/opt/bootstrap',
      siteHealthEndpoint: '/api/health',
      siteLambda: this.node.tryGetContext('siteLambda'),
      siteLog: this.node.tryGetContext('testLogGroup'),
      siteLogBucket: this.node.tryGetContext('siteLogBucket'),
      siteOriginRequestPolicy: this.node.tryGetContext('siteOriginRequestPolicy'),
      siteOriginResponseHeadersPolicy: this.node.tryGetContext('siteOriginResponseHeadersPolicy'),
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

class TestSiteWithLambdaBackend extends SiteWithLambdaBackend {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props
    this.id = 'test-site'
    this.initResources()
  }

  protected createSiteLambdaApplication() {
    this.siteLambdaApplication = AssetCode.fromAsset('src/test/aws/common/nodejs/lib')
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-site-stack', testStackProps)
const template = Template.fromStack(stack)

describe('SiteWithLambdaBackend', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })
})

describe('SiteWithLambdaBackend', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 0)
    template.resourceCountIs('AWS::IAM::Role', 4)
    template.resourceCountIs('AWS::IAM::Policy', 2)
    template.resourceCountIs('AWS::Logs::LogGroup', 2)
    template.resourceCountIs('AWS::Route53::RecordSet', 1)
    template.resourceCountIs('AWS::CodeBuild::Project', 1)
    template.resourceCountIs('Custom::AWS', 1)
    template.resourceCountIs('AWS::CloudFront::Distribution', 1)
    template.resourceCountIs('AWS::Lambda::Function', 3)
    template.resourceCountIs('AWS::CloudFront::Function', 1)
    template.resourceCountIs('AWS::CloudFront::CachePolicy', 1)
    template.resourceCountIs('AWS::CloudFront::OriginRequestPolicy', 1)
    template.resourceCountIs('AWS::Lambda::Version', 1)
    template.resourceCountIs('AWS::Lambda::Alias', 1)
    template.resourceCountIs('AWS::Lambda::EventInvokeConfig', 1)
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 1)
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 1)
    template.resourceCountIs('AWS::Lambda::Url', 1)
    template.resourceCountIs('AWS::Lambda::Permission', 2)
  })
})

describe('SiteWithLambdaBackend', () => {
  test('outputs as expected', () => {
    template.hasOutput('testSiteHostedZoneHostedZoneId', {})
    template.hasOutput('testSiteHostedZoneHostedZoneArn', {})
    template.hasOutput('testSiteCertificateCertificateArn', {})
    template.hasOutput('testSiteRegionalCertificateCertificateArn', {})
    template.hasOutput('testSiteSiteLogsBucketName', {})
    template.hasOutput('testSiteSiteLogsBucketArn', {})
    template.hasOutput('testSiteRoleArn', {})
    template.hasOutput('testSiteRoleName', {})
    template.hasOutput('testSiteLambdaLatestLambdaAliasName', {})
    template.hasOutput('testSiteLambdaLatestLambdaAliasArn', {})
    template.hasOutput('testSiteLambdaLatestAliasArn', {})
    template.hasOutput('testSiteLambdaLatestAliasName', {})
    template.hasOutput('testSiteLambdaLambdaArn', {})
    template.hasOutput('testSiteLambdaLambdaName', {})
    template.hasOutput('testSiteUrl', {})
    template.hasOutput('testSiteFunctionFunctionArn', {})
    template.hasOutput('testSiteFunctionFunctionName', {})
    template.hasOutput('testSiteDistributionDistributionId', {})
    template.hasOutput('testSiteDistributionDistributionDomainName', {})
    template.hasOutput('testSiteARecordARecordDomainName', {})
    template.hasOutput('testSiteCacheInvalidationBuildImageDockerImageArn', {})
    template.hasOutput('testSiteCacheInvalidationProjectLogGroupLogGroupArn', {})
  })
})

describe('SiteWithLambdaBackend', () => {
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
      Tags: [
        {
          Key: 'aws-cdk:auto-delete-objects',
          Value: 'true',
        },
      ],
    })
  })
})

describe('SiteWithLambdaBackend', () => {
  test('provisions site distribution as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['site-test.test.gradientedge.io'],
        Comment: 'test-site-distribution - test stage',
        DefaultCacheBehavior: {
          CachePolicyId: {
            Ref: 'testsitestacktestsitesitecachepolicy3FFA1F0E',
          },
          Compress: true,
          FunctionAssociations: [
            {
              EventType: 'viewer-request',
              FunctionARN: {
                'Fn::GetAtt': ['testsitestacktestsitefunctionF68C253C', 'FunctionARN'],
              },
            },
          ],
          OriginRequestPolicyId: {
            Ref: 'testsitestacktestsitesorp2C35A58F',
          },
          TargetOriginId: 'test-site-server',
          ViewerProtocolPolicy: 'redirect-to-https',
        },
        Enabled: true,
        HttpVersion: 'http2',
        IPV6Enabled: true,
        Logging: {
          Bucket: {
            'Fn::GetAtt': ['testsitestacktestsitesitelogsbucketD61B0D8C', 'RegionalDomainName'],
          },
          IncludeCookies: true,
          Prefix: 'edge/',
        },
        Origins: [
          {
            CustomOriginConfig: {
              HTTPPort: 443,
              OriginProtocolPolicy: 'https-only',
              OriginSSLProtocols: ['TLSv1.2'],
            },
            DomainName: {
              'Fn::Select': [
                2,
                {
                  'Fn::Split': [
                    '/',
                    {
                      'Fn::GetAtt': ['testsitestacktestsitefnaliasFunctionUrlE67BA968', 'FunctionUrl'],
                    },
                  ],
                },
              ],
            },
            Id: 'test-site-server',
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

describe('SiteWithLambdaBackend', () => {
  test('provisions codebuild project as expected', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      EncryptionKey: 'alias/aws/s3',
      TimeoutInMinutes: 5,
    })
  })
})

describe('SiteWithLambdaBackend', () => {
  test('provisions route53 records as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'site-test.test.gradientedge.io.',
      Type: 'A',
    })
  })
})

describe('SiteWithLambdaBackend', () => {
  test('provisions cloudfront function as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Function', {
      FunctionConfig: {
        Comment: 'test comment',
      },
      Name: 'test-site-function-test',
    })
  })
})

describe('SiteWithLambdaBackend', () => {
  test('provisions cloudfront cache policy as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
      CachePolicyConfig: {
        Comment: 'Policy for test-site-distribution - test stage',
        DefaultTTL: 86400,
        MaxTTL: 2592000,
        MinTTL: 60,
        Name: 'test-site-site-cache-policy',
      },
    })
  })
})

describe('SiteWithLambdaBackend', () => {
  test('provisions cloudfront cache policy as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Url', {
      AuthType: 'NONE',
      TargetFunctionArn: {
        'Fn::Join': ['', [{ 'Fn::GetAtt': ['testsitestacktestsitelambdaC503A7D7', 'Arn'] }, ':latest']],
      },
    })
  })
})
