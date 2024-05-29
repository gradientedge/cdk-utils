import { App, StackProps } from 'aws-cdk-lib'
import { Template, Match } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { Source } from 'aws-cdk-lib/aws-s3-deployment'
import { StaticAssetDeployment, StaticAssetDeploymentProps, CommonStack } from '../../../lib'
import { ref, findOneResourceId } from '../../tools/cdk'

const testStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/aws/common/cdkConfig/buckets.json', 'src/test/aws/common/cdkConfig/staticAsset.json'],
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
      staticAssetDeployment: this.node.tryGetContext('staticAssetDeployment'),
      staticAssetSources: [Source.asset('src/test/aws/common/resources/')],
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

describe('StaticAssetDeployment Default', () => {
  describe('TestStaticAssetDeploymentConstruct', () => {
    test('synthesises as expected', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1)
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 1)
      template.resourceCountIs('Custom::CDKBucketDeployment', 1)
    })
  })

  describe('TestStaticAssetDeploymentConstruct', () => {
    test('has bucket outputs', () => {
      template.hasOutput('testStaticAssetDeploymentSaBucketBucketName', {})
      template.hasOutput('testStaticAssetDeploymentSaBucketBucketArn', {})
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

  describe('Custom::CDKBucketDeployment', () => {
    test('properties', () => {
      template.hasResourceProperties('Custom::CDKBucketDeployment', {
        Prune: true,
        RetainOnDelete: false,
        DestinationBucketName: ref(findOneResourceId(template, 'AWS::S3::Bucket')),
        DestinationBucketKeyPrefix: Match.absent(),
        DistributionId: Match.absent(),
      })
    })
  })
})
