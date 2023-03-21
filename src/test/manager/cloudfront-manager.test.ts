import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import * as types from '../../lib/types'

interface TestStackProps extends types.CommonStackProps {
  testBucket: any
  testLogBucket: any
  testCertificate: any
  testDistribution: any
  testLambdaEdge: any
  testEdgeDistribution: any
  testFunction: any
}

const testStackProps = {
  env: {
    account: '123456789',
    region: 'us-east-1',
  },
  name: 'test-common-stack',
  domainName: 'gradientedge.io',
  region: 'us-east-1',
  stackName: 'test',
  stage: 'test',
  extraContexts: [
    'src/test/common/cdkConfig/buckets.json',
    'src/test/common/cdkConfig/certificates.json',
    'src/test/common/cdkConfig/distributions.json',
    'src/test/common/cdkConfig/lambdas.json',
    'src/test/common/cdkConfig/function.json',
  ],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends common.CommonStack {
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
        testLambdaEdge: this.node.tryGetContext('testLambdaEdge'),
        testEdgeDistribution: this.node.tryGetContext('testEdgeDistribution'),
        testFunction: this.node.tryGetContext('siteFunction'),
      },
    }
  }
}

class TestInvalidCommonStack extends common.CommonStack {
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
        testLambdaEdge: this.node.tryGetContext('testLambdaEdge'),
        testEdgeDistribution: this.node.tryGetContext('testEdgeDistribution'),
        testFunction: this.node.tryGetContext('siteFunction'),
      },
    }
  }
}

class TestCommonConstruct extends common.CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const siteBucket = this.s3Manager.createS3Bucket('test-bucket', this, this.props.testBucket)
    const siteLogBucket = this.s3Manager.createS3Bucket('test-log-bucket', this, this.props.testLogBucket)
    const oai = this.cloudFrontManager.createOriginAccessIdentity('test-oai-bucket', this, siteBucket)
    const certificate = this.acmManager.resolveCertificate('test-certificate', this, this.props.testCertificate)
    const siteOrigin = new origins.S3Origin(siteBucket, { originAccessIdentity: oai })
    const testRole = this.iamManager.createRoleForLambda(
      'test-role',
      this,
      new iam.PolicyDocument({ statements: [this.iamManager.statementForReadSecrets(this)] })
    )
    const cloudfrontFunction = this.cloudFrontManager.createCloudfrontFunction(
      'test-function',
      this,
      this.props.testFunction
    )
    const defaultFunctionAssociations = [
      {
        function: cloudfrontFunction,
        eventType: cloudfront.FunctionEventType.VIEWER_RESPONSE,
      },
    ]
    this.cloudFrontManager.createCloudFrontDistribution(
      'test-distribution',
      this,
      this.props.testDistribution,
      siteBucket,
      siteLogBucket,
      oai,
      certificate
    )
    const testLayer = this.lambdaManager.createLambdaLayer(
      'test-lambda-layer',
      this,
      new lambda.AssetCode('src/test/common/nodejs/lib')
    )
    const edgeFunction = this.lambdaManager.createEdgeFunction(
      'test-lambda-edge',
      this,
      this.props.testLambdaEdge,
      [testLayer],
      new lambda.AssetCode('src/test/common/nodejs/lib'),
      testRole
    )
    const distribution = this.cloudFrontManager.createDistributionWithS3Origin(
      'test-edge-distribution',
      this,
      this.props.testEdgeDistribution,
      siteOrigin,
      siteBucket,
      siteLogBucket,
      oai,
      certificate,
      undefined,
      defaultFunctionAssociations
    )
    distribution.addBehavior('product/*', siteOrigin, {
      edgeLambdas: [
        {
          functionVersion: edgeFunction.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
        },
      ],
    })
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
    template.resourceCountIs('AWS::CloudFront::Distribution', 2)
    template.resourceCountIs('AWS::Lambda::Function', 3)
    template.resourceCountIs('AWS::CloudFront::Function', 1)
  })
})

describe('TestCloudFrontConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testDistributionDistributionId', {})
    template.hasOutput('testDistributionDistributionDomainName', {})
    template.hasOutput('testLambdaEdgeEdgeArn', {})
    template.hasOutput('testLambdaEdgeEdgeFunctionArn', {})
    template.hasOutput('testLambdaEdgeEdgeFunctionName', {})
    template.hasOutput('testEdgeDistributionDistributionId', {})
    template.hasOutput('testEdgeDistributionDistributionDomainName', {})
    template.hasOutput('testFunctionFunctionArn', {})
    template.hasOutput('testFunctionFunctionName', {})
  })
})
describe('TestCloudFrontConstruct', () => {
  test('provisions new edge lambda as expected', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'test-lambda-edge-test',
      Handler: 'index.handler',
      MemorySize: 1024,
      Runtime: 'nodejs18.x',
      Timeout: 60,
    })
  })
})

describe('TestCloudFrontConstruct', () => {
  test('provisions new web distribution as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: [
          {
            Ref: 'testcommonstacktestbucketbucketF5398BC0',
          },
        ],
        Comment: 'test-distribution - test stage',
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
          TargetOriginId: 'origin1',
          ViewerProtocolPolicy: 'redirect-to-https',
        },
        DefaultRootObject: 'index.html',
        Enabled: true,
        HttpVersion: 'http2',
        IPV6Enabled: true,
        Logging: {
          Bucket: {
            'Fn::GetAtt': ['testcommonstacktestlogbucketbucket7A4C0A1A', 'RegionalDomainName'],
          },
          IncludeCookies: false,
          Prefix: 'cloudfront/',
        },
        Origins: [
          {
            ConnectionAttempts: 3,
            ConnectionTimeout: 10,
            DomainName: {
              'Fn::GetAtt': ['testcommonstacktestbucketbucketF5398BC0', 'RegionalDomainName'],
            },
            Id: 'origin1',
            S3OriginConfig: {
              OriginAccessIdentity: {
                'Fn::Join': [
                  '',
                  [
                    'origin-access-identity/cloudfront/',
                    {
                      Ref: 'testcommonstacktestoaibucketFE1CC877',
                    },
                  ],
                ],
              },
            },
          },
        ],
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

describe('TestCloudFrontConstruct', () => {
  test('provisions new edge distribution as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: [
          {
            Ref: 'testcommonstacktestbucketbucketF5398BC0',
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
                  Ref: 'testcommonstacktestlambdaedgeFnCurrentVersionD68B801D343f717388209a2096f8d3a566478f0e',
                },
              },
            ],
            PathPattern: 'product/*',
            TargetOriginId: 'testcommonstacktestedgedistributionOrigin1F7D3F0CB',
            ViewerProtocolPolicy: 'allow-all',
          },
        ],
        Comment: 'test-edge-distribution - test stage',
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
          FunctionAssociations: [
            {
              EventType: 'viewer-response',
              FunctionARN: {
                'Fn::GetAtt': ['testcommonstacktestfunction800AF467', 'FunctionARN'],
              },
            },
          ],
          TargetOriginId: 'testcommonstacktestedgedistributionOrigin1F7D3F0CB',
          ViewerProtocolPolicy: 'allow-all',
        },
        Enabled: true,
        HttpVersion: 'http2',
        IPV6Enabled: true,
        Logging: {
          Bucket: {
            'Fn::GetAtt': ['testcommonstacktestlogbucketbucket7A4C0A1A', 'RegionalDomainName'],
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
                      'Fn::GetAtt': ['testcommonstacktestbucketbucketF5398BC0', 'WebsiteURL'],
                    },
                  ],
                },
              ],
            },
            Id: 'testcommonstacktestedgedistributionOrigin1F7D3F0CB',
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

describe('TestCloudFrontConstruct', () => {
  test('provisions cloudfront function as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Function', {
      Name: 'test-function-test',
      FunctionConfig: {
        Comment: 'test comment',
      },
    })
  })
})
