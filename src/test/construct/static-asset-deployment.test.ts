import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import * as common from '../../lib/common'
import { StaticAssetDeployment, StaticAssetDeploymentProps } from '../../lib/construct'

interface TestStackProps extends StaticAssetDeploymentProps {
  staticAssetDeployment: any
  staticAssetSources: any
  staticAssetBucket: any
  staticAssetsForExport: any
}

const testStackProps = {
  name: 'test-static-asset-deployment-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stage: 'test',
  stackName: 'test',
  siteSubDomain: 'site',
  siteCreateAltARecord: true,
  extraContexts: ['src/test/common/cdkConfig/buckets.json'],
  stageContextPath: 'src/test/common/cdkEnv',
  skipStageForARecords: true,
}

class TestCommonStack extends common.CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestStaticAssetDeployment(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      staticAssetDeployment: {
        prune: true,
        retainOnDelete: false,
      },
      staticAssetSources: [s3deploy.Source.asset('src/test/common/resources/')],
      staticAssetBucket: this.node.tryGetContext('siteBucket'),
      staticAssetsForExport: [{ key: 'myCSV', value: 'test.csv' }],
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

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-static-asset-deployment-stack', testStackProps)
const template = Template.fromStack(stack)

describe('TestStaticAssetDeploymentConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('staticAssetDeployment')
    expect(stack.props.staticAssetDeployment.prune).toEqual(true)
  })
})

describe('TestStaticAssetDeploymentConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::S3::Bucket', 1)
    template.resourceCountIs('Custom::S3AutoDeleteObjects', 1)
    template.resourceCountIs('Custom::CDKBucketDeployment', 1)
  })
})

describe('TestStaticAssetDeploymentConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testStaticAssetDeploymentSaBucketBucketName', {})
    template.hasOutput('testStaticAssetDeploymentSaBucketBucketArn', {})
    template.hasOutput('myCsv', {})
  })
})

describe('TestStaticAssetDeploymentConstruct', () => {
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
