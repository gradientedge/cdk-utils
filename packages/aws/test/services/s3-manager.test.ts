import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import _ from 'lodash'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testBucket: any
  testLogBucket: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  excludeDomainNameForBuckets: true,
  extraContexts: ['packages/aws/test/common/cdk-config/buckets.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdk-env',
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
        testLogBucket: this.node.tryGetContext('siteLogBucket'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.s3Manager.createS3Bucket(`test-log-bucket`, this, this.props.testLogBucket)
    this.s3Manager.createS3Bucket(`test-bucket`, this, this.props.testBucket)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestS3Manager', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::S3::Bucket', 2)
    template.resourceCountIs('Custom::S3AutoDeleteObjects', 2)
  })
})

describe('TestS3Manager', () => {
  test('outputs as expected', () => {
    template.hasOutput('testLogBucketBucketName', {})
    template.hasOutput('testLogBucketBucketArn', {})
    template.hasOutput('testBucketBucketName', {})
    template.hasOutput('testBucketBucketArn', {})
  })
})

describe('TestS3Manager', () => {
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
      BucketName: 'site-logs-123456789-eu-west-1-test',
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    })
  })
})

describe('TestS3Manager', () => {
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
      BucketName: 'site-123456789-eu-west-1-test',
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    })
  })
})

/* Test S3 with lifecycle rules and bucket folders */
const testS3LifecycleProps = {
  ...testStackProps,
  name: 'test-s3-lifecycle-stack',
}

class TestS3LifecycleStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)
    this.construct = new TestS3LifecycleConstruct(this, testS3LifecycleProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testBucket: this.node.tryGetContext('siteBucket'),
        testLogBucket: this.node.tryGetContext('siteLogBucket'),
      },
    }
  }
}

class TestS3LifecycleConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)

    const bucket = this.s3Manager.createS3Bucket('test-lifecycle-bucket', this, {
      ...this.props.testBucket,
      lifecycleRules: [
        {
          enabled: true,
          expirationInDays: 30,
          noncurrentVersionExpirationInDays: 7,
          id: 'test-rule',
        },
      ],
    })

    this.s3Manager.createBucketFolders('test-folders', this, bucket, ['data', 'uploads'])
  }
}

const appS3Lifecycle = new cdk.App({ context: testS3LifecycleProps })
const stackS3Lifecycle = new TestS3LifecycleStack(appS3Lifecycle, 'test-s3-lifecycle-stack', testS3LifecycleProps)
const templateS3Lifecycle = Template.fromStack(stackS3Lifecycle)

describe('TestS3ManagerLifecycle', () => {
  test('provisions bucket with lifecycle rules', () => {
    templateS3Lifecycle.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            ExpirationInDays: 30,
            NoncurrentVersionExpiration: {
              NoncurrentDays: 7,
            },
            Status: 'Enabled',
          },
        ],
      },
    })
  })

  test('provisions bucket folders', () => {
    templateS3Lifecycle.resourceCountIs('Custom::CDKBucketDeployment', 2)
  })
})

/* Test S3 access logging wired through the new `logBucket` (L2) prop */
class TestS3OwnedLogBucketStack extends CommonStack {
  declare props: TestStackProps
  declare construct: TestS3OwnedLogBucketConstruct

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)
    this.construct = new TestS3OwnedLogBucketConstruct(this, 'test-s3-owned-log-bucket', this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testBucket: this.node.tryGetContext('siteBucket'),
        testLogBucket: this.node.tryGetContext('siteLogBucket'),
      },
    }
  }
}

class TestS3OwnedLogBucketConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const logBucket = this.s3Manager.createS3Bucket('test-owned-log-bucket', this, this.props.testLogBucket)
    this.s3Manager.createS3Bucket('test-owned-bucket', this, { ...this.props.testBucket, logBucket })
  }
}

const appS3Owned = new cdk.App({ context: testStackProps })
const stackS3Owned = new TestS3OwnedLogBucketStack(appS3Owned, 'test-s3-owned-log-bucket-stack', testStackProps)
const templateS3Owned = Template.fromStack(stackS3Owned)

describe('TestS3ManagerOwnedLogBucket', () => {
  test('wires LoggingConfiguration via Ref to the owned log bucket as expected', () => {
    /* When the caller passes the L2 IBucket, CDK can resolve the log destination
       to a same-stack Ref instead of a literal bucket name string — which is what
       allows it to attach the log-delivery policy and avoid the
       @aws-cdk/aws-s3:accessLogsPolicyNotAdded warning. */
    const buckets = _.pickBy(
      templateS3Owned.toJSON().Resources as Record<string, { Type: string; Properties: any }>,
      resource => resource.Type === 'AWS::S3::Bucket'
    )
    const sourceBucket = _.find(buckets, bucket => bucket.Properties.BucketName === 'site-123456789-eu-west-1-test')
    const logBucketLogicalId = _.findKey(
      buckets,
      bucket => bucket.Properties.BucketName === 'site-logs-123456789-eu-west-1-test'
    )
    expect(sourceBucket?.Properties.LoggingConfiguration).toEqual({
      DestinationBucketName: { Ref: logBucketLogicalId },
      LogFilePrefix: 'logs/',
    })
  })
})

describe('TestS3Manager - Error Handling', () => {
  test('throws error when folders are empty', () => {
    const testStack = new TestCommonStack(app, 'test-error-folders', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.s3Manager.createBucketFolders('test-no-folders', testConstruct, {} as any, [])
    }).toThrow('Folder unspecified for test-no-folders')
  })
})
