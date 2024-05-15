import { AppProps } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Source } from 'aws-cdk-lib/aws-s3-deployment'
import { StaticAssetDeployment, StaticAssetDeploymentProps } from '../../../lib'
import { TableTestTuple, ref, findOneResourceId, s3AssetSpyInit, mapToBucketName, createApp } from '../../cdk'
import { describeIf, isLengthOne, isDefined } from '../../jest-ext'

const { s3AssetSpySetup, s3AssetSpyRestore } = s3AssetSpyInit()

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
} as any as AppProps

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
  staticAssetsForExport: [{ key: 'myCSV', value: 'test.csv' }],
} as any as StaticAssetDeploymentProps

type StaticAssetDeploymentExpected = {
  bucketCount: number
  prune: boolean
  sourceObjectKeys: Array<string>
  destinationKeyPrefix?: string
  destinationBucket?: string
}

const defaultExpected: StaticAssetDeploymentExpected = {
  bucketCount: 1,
  prune: true,
  sourceObjectKeys: ['resources.zip'],
}

describe('StaticAssetDeployment', () => {
  beforeAll(s3AssetSpySetup)

  afterAll(s3AssetSpyRestore)

  describe.each<TableTestTuple<StaticAssetDeploymentProps, StaticAssetDeploymentExpected>>([
    ['create bucket when `createBucket` is not configured', defaultProps, defaultExpected],
    ['create bucket when `createBucket` is set to true', { ...defaultProps, createBucket: true }, defaultExpected],
    [
      'resolves bucket when `createBucket` is set to false',
      { ...defaultProps, createBucket: false },
      { ...defaultExpected, bucketCount: 0, destinationBucket: 'site' },
    ],
    [
      'creates static assets source when passed as a string reference',
      { ...defaultProps, staticAssetSources: ['first_object_key'] },
      { ...defaultExpected, sourceObjectKeys: ['first_object_key.zip'] },
    ],
    [
      'creates static assets sources when passed as a string reference',
      { ...defaultProps, staticAssetSources: ['first_object_key', 'second_object_key'] },
      { ...defaultExpected, sourceObjectKeys: ['first_object_key.zip', 'second_object_key.zip'] },
    ],
    [
      'uses destinaion key prefix to deploy static assets',
      { ...defaultProps, destinationKeyPrefix: 'customprefixkey' },
      { ...defaultExpected, destinationKeyPrefix: 'customprefixkey' },
    ],
    [
      'does not pass prune flag when is not set',
      { ...defaultProps, prune: false },
      { ...defaultExpected, prune: false },
    ],
  ])('%# %s', (_name, props, expected) => {
    let template: Template
    beforeEach(() => {
      // we have to configure Static.asset here otherwise mock is not going to work
      // and assertions are going to fail
      if (!props.staticAssetSources) {
        props.staticAssetSources = [Source.asset('src/test/aws/common/resources')]
      }

      ;({ template } = createApp({
        context: testContext,
        props: props,
        stackName: 'test-static-asset-deployment-stack',
        Construct: StaticAssetDeployment,
      }))
    })

    describe('TestStaticAssetDeploymentConstruct', () => {
      test('synthesises as expected', () => {
        template.resourceCountIs('AWS::S3::Bucket', expected.bucketCount)
        template.resourceCountIs('Custom::S3AutoDeleteObjects', expected.bucketCount)
        template.resourceCountIs('Custom::CDKBucketDeployment', 1)
      })
    })

    describe('TestStaticAssetDeploymentConstruct', () => {
      describeIf(expected.bucketCount === 1, () => {
        test('has bucket outputs', () => {
          template.hasOutput('testStaticAssetDeploymentStackSaBucketBucketName', {})
          template.hasOutput('testStaticAssetDeploymentStackSaBucketBucketArn', {})
        })
      })

      test('has custom outputs', () => {
        template.hasOutput('myCsv', {})
      })
    })

    describe('AWS::S3::Bucket', () => {
      describeIf(isLengthOne(expected.bucketCount), () => {
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
    })

    describe('Custom::CDKBucketDeployment', () => {
      test('properties', () => {
        const destinationBucket = expected.destinationBucket ?? ref(findOneResourceId(template, 'AWS::S3::Bucket'))
        template.hasResourceProperties('Custom::CDKBucketDeployment', {
          Prune: expected.prune,
          RetainOnDelete: false,
          SourceObjectKeys: expected.sourceObjectKeys,
          SourceBucketNames: mapToBucketName(expected.sourceObjectKeys),
          DestinationBucketName: destinationBucket,
        })
      })

      describeIf(isDefined(expected.destinationKeyPrefix), () => {
        test('destination key prefix', () => {
          template.hasResourceProperties('Custom::CDKBucketDeployment', {
            DestinationBucketKeyPrefix: expected.destinationKeyPrefix,
          })
        })
      })
    })
  })
})
