import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib/aws/index.js'

interface TestStackProps extends CommonStackProps {
  testBucket: any
  testCertificate: any
  testDistribution: any
  testEdgeDistribution: any
  testFunction: any
  testLambdaEdge: any
  testLogBucket: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'us-east-1',
  },
  extraContexts: [
    'src/test/aws/common/cdkConfig/buckets.json',
    'src/test/aws/common/cdkConfig/certificates.json',
    'src/test/aws/common/cdkConfig/distributions.json',
    'src/test/aws/common/cdkConfig/lambdas.json',
    'src/test/aws/common/cdkConfig/function.json',
  ],
  name: 'test-common-stack',
  region: 'us-east-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
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
        testCertificate: this.node.tryGetContext('siteCertificate'),
        testDistribution: this.node.tryGetContext('siteDistribution'),
        testEdgeDistribution: this.node.tryGetContext('testEdgeDistribution'),
        testFunction: this.node.tryGetContext('siteFunction'),
        testLambdaEdge: this.node.tryGetContext('testLambdaEdge'),
        testLogBucket: this.node.tryGetContext('siteLogBucket'),
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
        testCertificate: this.node.tryGetContext('siteCertificate'),
        testFunction: this.node.tryGetContext('siteFunction'),
        testLambdaEdge: this.node.tryGetContext('testLambdaEdge'),
        testLogBucket: this.node.tryGetContext('siteLogBucket'),
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
        eventType: cloudfront.FunctionEventType.VIEWER_RESPONSE,
        function: cloudfrontFunction,
      },
    ]
    const testLayer = this.lambdaManager.createLambdaLayer(
      'test-lambda-layer',
      this,
      new lambda.AssetCode('src/test/aws/common/nodejs/lib')
    )
    const edgeFunction = this.lambdaManager.createEdgeFunction(
      'test-lambda-edge',
      this,
      this.props.testLambdaEdge,
      [testLayer],
      new lambda.AssetCode('src/test/aws/common/nodejs/lib'),
      testRole
    )
    const distribution = this.cloudFrontManager.createDistributionWithS3Origin(
      'test-edge-distribution',
      this,
      {
        ...this.props.testEdgeDistribution,
        defaultBehavior: {
          ...this.props.testEdgeDistribution.defaultBehavior,
          'product/*': {
            edgeLambdas: [
              {
                eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
                functionVersion: edgeFunction.currentVersion,
              },
            ],
          },
        },
      },
      siteBucket,
      siteLogBucket,
      oai,
      certificate,
      ['test.gradientedge.io'],
      defaultFunctionAssociations
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestCloudFrontConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrowError()
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
    template.resourceCountIs('AWS::Lambda::Function', 2)
    template.resourceCountIs('AWS::CloudFront::Function', 1)
  })
})

describe('TestCloudFrontConstruct', () => {
  test('outputs as expected', () => {
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
      FunctionName: 'cdktest-test-lambda-edge-test',
      Handler: 'index.handler',
      MemorySize: 1024,
      Runtime: 'nodejs24.x',
      Timeout: 60,
    })
  })
})

describe('TestCloudFrontConstruct', () => {
  test('provisions new edge distribution as expected', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['test.gradientedge.io'],
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
            DomainName: {
              'Fn::GetAtt': ['testcommonstacktestbucketbucketF5398BC0', 'RegionalDomainName'],
            },
            Id: 'testcommonstacktestedgedistributionOrigin1F7D3F0CB',
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
      FunctionConfig: {
        Comment: 'test comment',
      },
      Name: 'cdktest-test-function-test',
    })
  })
})
