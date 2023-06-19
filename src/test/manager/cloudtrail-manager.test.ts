import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../lib'

interface TestStackProps extends CommonStackProps {
  testBucket: any
  testLogBucket: any
  testLogGroup: any
  testTrail: any
}

const testStackProps = {
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  name: 'test-common-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  extraContexts: [
    'src/test/common/cdkConfig/buckets.json',
    'src/test/common/cdkConfig/logs.json',
    'src/test/common/cdkConfig/trails.json',
  ],
  stageContextPath: 'src/test/common/cdkEnv',
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
        testLogGroup: this.node.tryGetContext('testLogGroup'),
        testTrail: this.node.tryGetContext('testTrail'),
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
        testLogBucket: this.node.tryGetContext('siteLogBucket'),
        testLogGroup: this.node.tryGetContext('testLogGroup'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const logGroup = this.logManager.createCfnLogGroup('test-ct-log-group', this, this.props.testLogGroup)
    const testDataBucket = this.s3Manager.createS3Bucket('test-ct-bucket', this, this.props.testBucket)
    const testLogBucket = this.s3Manager.createS3Bucket('test-ct-log-bucket', this, this.props.testLogBucket)
    const logBucketPolicy = this.s3Manager.createBucketPolicyForCloudTrail(
      'test-ct-bucket-policy',
      this,
      testDataBucket
    )
    this.cloudTrailManager.createCloudTrail(
      'test-trail',
      this,
      this.props.testTrail,
      logGroup,
      testDataBucket,
      testLogBucket,
      logBucketPolicy
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestCloudTrailConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('CloudTrail props undefined')
  })
})

describe('TestCloudTrailConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props.testTrail.trailName).toEqual('test-trail')
  })
})

describe('TestCloudTrailConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::CloudTrail::Trail', 1)
  })
})

describe('TestCloudTrailConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testTrailRoleArn', {})
    template.hasOutput('testTrailRoleName', {})
    template.hasOutput('testTrailTrailName', {})
    template.hasOutput('testTrailTrailArn', {})
  })
})

describe('TestCloudTrailConstruct', () => {
  test('provisions new trail as expected', () => {
    template.hasResourceProperties('AWS::CloudTrail::Trail', {
      IsLogging: true,
      EnableLogFileValidation: false,
      IncludeGlobalServiceEvents: false,
      IsMultiRegionTrail: false,
      S3KeyPrefix: 'logs-test-trail',
      TrailName: 'test-trail-test',
    })
  })
})
