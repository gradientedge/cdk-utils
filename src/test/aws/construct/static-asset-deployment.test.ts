import * as cdk from 'aws-cdk-lib'
import { App, StackProps } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import {
  CommonStack,
  StaticAssetDeployment,
  StaticAssetDeploymentProps,
  CommonConstruct,
  CommonStackProps,
} from '../../../lib'

const testContext = {
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

// get props
function createTestStack<P extends CommonStackProps, T extends CommonConstruct<P>>(
  app: App,
  Construct: new (parent: Construct, id: string, props: P) => T,
  id: string,
  appProps: P
): CommonStack {
  class InitTestCommonStack extends CommonStack {
    constructor(parent: cdk.App, id: string, props: P) {
      super(parent, id, props)

      this.construct = new Construct(this, id, { ...this.props, ...props })
      // ideally this would be part of
      if ('initResources' in this.construct && typeof this.construct.initResources === 'function') {
        this.construct.initResources()
      }
    }
  }

  return new InitTestCommonStack(app, id, appProps)
}

const createStack = (
  context: typeof testContext,
  props: StaticAssetDeploymentProps
): { stack: CommonStack; template: Template } => {
  const app = new cdk.App({ context })
  const stack = createTestStack(app, StaticAssetDeployment, 'test-static-asset-deployment-stack', props)

  const template = Template.fromStack(stack)
  return { stack, template }
}

// name, stack and expected
type TestTuple = [string, { stack: CommonStack; template: Template }, { bucketCount: number }]

const defaultProps = {
  staticAssetBucket: {
    bucketName: 'site',
    autoDeleteObjects: true,
    removalPolicy: 'destroy',
    serverAccessLogsPrefix: 'logs/',
    websiteIndexDocument: 'index.html',
    websiteErrorDocument: 'index.html',
    existingBucket: false,
  },
  staticAssetDeployment: {
    prune: true,
    retainOnDelete: false,
  },
  staticAssetSources: [s3deploy.Source.asset('src/test/aws/common/resources/')],
  staticAssetsForExport: [{ key: 'myCSV', value: 'test.csv' }],
} as any as StaticAssetDeploymentProps

describe.each<TestTuple>([
  [
    'create bucket when `createBucket` is not configured',
    createStack(testContext, defaultProps),
    {
      bucketCount: 1,
    },
  ],
  [
    'create bucket when `createBucket` is set to true',
    createStack(testContext, { ...defaultProps, createBucket: true }),
    {
      bucketCount: 1,
    },
  ],
  [
    'resolves bucket when `createBucket` is set to false',
    createStack(testContext, { ...defaultProps, createBucket: false }),
    {
      bucketCount: 0,
    },
  ],
  // ['uses passed static assets sources', createStack(testContext, testProps), {}],
  // ['creates statis assets sources when passed as a string reference', createStack(testContext, testProps), {}],
  // ['uses destinaion key prefix to deploy static assets', createStack(testContext, testProps), {}],
  // ['uses destinaion key prefix to deploy static assets', createStack({ ...testContext }, testProps), {}],
  // ['passes prune flag when set to true', createStack({ ...testContext }, testProps), {}],
  // ['does not pass prune flag when set to false', createStack({ ...testContext }, testProps), {}],
  // ['does not pass prune flag when is not set', createStack({ ...testContext }, testProps), {}],
  // prune
])('%# %s', (_name, { stack, template }, expected) => {
  // not sure if that make sense if we are testing expected output

  describe('TestStaticAssetDeploymentConstruct', () => {
    test('synthesises as expected', () => {
      /* test if number of resources are correctly synthesised */
      template.resourceCountIs('AWS::S3::Bucket', expected.bucketCount)
      template.resourceCountIs('Custom::S3AutoDeleteObjects', expected.bucketCount)
      template.resourceCountIs('Custom::CDKBucketDeployment', 1)
    })
  })

  describe('TestStaticAssetDeploymentConstruct', () => {
    test('outputs as expected', () => {
      if (expected.bucketCount === 1) {
        template.hasOutput('testStaticAssetDeploymentStackSaBucketBucketName', {})
        template.hasOutput('testStaticAssetDeploymentStackSaBucketBucketArn', {})
      }
      template.hasOutput('myCsv', {})
    })
  })

  describe('TestStaticAssetDeploymentConstruct', () => {
    test('provisions asset bucket as expected', () => {
      if (expected.bucketCount === 1) {
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
      }
    })
  })
})
