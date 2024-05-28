import { App, StackProps } from 'aws-cdk-lib'
import { Template, Capture } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { StaticAssetDeployment, StaticAssetDeploymentProps, CommonStack } from '../../../lib'
import { ref, findOneResourceId } from '../../cdk'

const testStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/aws/common/cdkConfig/buckets.json'],
  name: 'test-static-asset-deployment-stack',
  region: 'eu-west-1',
  siteCreateAltARecord: true,
  siteSubDomain: 'site',
  skipStageForARecords: true,
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

interface TestStackProps extends StaticAssetDeploymentProps {}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: App, name: string, props: StackProps) {
    super(parent, name, props)

    this.construct = new TestStaticAssetDeployment(this, 'test-static-asset-deployment', this.props)
  }

  protected determineConstructProps(props: StackProps) {
    return {
      ...super.determineConstructProps(props),
      staticAssetBucket: this.node.tryGetContext('siteBucket'),
      staticAssetDeployment: {
        prune: false,
        retainOnDelete: false,
      },
      staticAssetSources: ['src/test/aws/common/resources/'],
      staticAssetsForExport: [{ key: 'myCSV', value: 'test.csv' }],
      destinationKeyPrefix: 'destination-path/',
      cloudFrontDistribution: {
        domainNameRef: 'test.one.io',
        distributionIdRef: 'D1',
        invalidationPaths: ['/*'],
      },
    }
  }
}

class TestStaticAssetDeployment extends StaticAssetDeployment {
  declare props: TestStackProps

  constructor(parent: Construct, id: string, props: TestStackProps) {
    super(parent, id, props)
    this.props = props
    this.id = 'test-static-asset-deployment'
    this.initResources()
  }
}

const app = new App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-static-asset-deployment-stack', testStackProps)
const template = Template.fromStack(stack)

describe('StaticAssetDeployment', () => {
  describe('TestStaticAssetDeploymentConstruct', () => {
    test('synthesises as expected', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1)
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 1)
      template.resourceCountIs('Custom::CDKBucketDeployment', 1)
      template.resourceCountIs('AWS::IAM::Policy', 1)
    })
  })

  describe('TestStaticAssetDeploymentConstruct', () => {
    test('has bucket outputs', () => {
      template.hasOutput('testStaticAssetDeploymentSaBucketBucketName', {})
      template.hasOutput('testStaticAssetDeploymentSaBucketBucketArn', {})
    })

    test('has custom outputs', () => {
      template.hasOutput('myCsv', {})
    })
  })

  describe('AWS::S3::Bucket', () => {
    test('provisions asset bucket as expected', () => {
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

  // write documentation for following method
  describe('Custom::CDKBucketDeployment', () => {
    test('properties', () => {
      template.hasResourceProperties('Custom::CDKBucketDeployment', {
        Prune: false,
        RetainOnDelete: false,
        DestinationBucketName: ref(findOneResourceId(template, 'AWS::S3::Bucket')),
        DestinationBucketKeyPrefix: 'destination-path/',
        DistributionId: {
          'Fn::ImportValue': 'D1',
        },
      })
    })
  })
  describe('AWS::IAM::Policy', () => {
    test('access policy', () => {
      const statementCapture = new Capture()

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: statementCapture,
        },
      })

      expect(statementCapture.asArray()).toHaveLength(3)
    })
    test('s3 access policy', () => {
      const statementCapture = new Capture()

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: statementCapture,
        },
      })

      expect(statementCapture.asArray()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Allow',
            Action: expect.arrayContaining(['s3:List*', 's3:GetObject*', 's3:GetBucket*']),
          }),
          expect.objectContaining({
            Effect: 'Allow',
            Action: expect.arrayContaining([
              's3:GetObject*',
              's3:GetBucket*',
              's3:List*',
              's3:DeleteObject*',
              's3:PutObject',
              's3:PutObjectLegalHold',
              's3:PutObjectRetention',
              's3:PutObjectTagging',
              's3:PutObjectVersionTagging',
              's3:Abort*',
            ]),
          }),
        ])
      )
    })
    test('cloudfront access policy', () => {
      const statementCapture = new Capture()

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: statementCapture,
        },
      })

      expect(statementCapture.asArray()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Allow',
            Resource: '*',
            Action: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
          }),
        ])
      )
    })
  })
})
