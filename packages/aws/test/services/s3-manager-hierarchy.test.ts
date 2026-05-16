import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testBucket: any
  testLogBucket: any
  logLevel?: string
  apiSubDomain?: string
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  excludeDomainNameForBuckets: true,
  extraContexts: ['packages/aws/test/common/cdkConfig/base.json', 'packages/aws/test/common/cdkConfig/buckets.json'],
  regionContextPath: 'packages/aws/test/common/cdkRegion',
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, testStackProps)
    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      testBucket: this.node.tryGetContext('siteBucket'),
      testLogBucket: this.node.tryGetContext('siteLogBucket'),
      logLevel: this.node.tryGetContext('logLevel'),
      globalPrefix: this.node.tryGetContext('globalPrefix'),
      apiSubDomain: this.node.tryGetContext('apiSubDomain'),
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.s3Manager.createS3Bucket('test-log-bucket', this, this.props.testLogBucket)
    this.s3Manager.createS3Bucket('test-bucket', this, this.props.testBucket)
  }
}

const app = new cdk.App({ context: testStackProps })
const stack = new TestCommonStack(app, 'test-s3-hierarchy-stack', testStackProps)
const template = Template.fromStack(stack)

describe('S3Manager - Region Context Hierarchy', () => {
  test('stage > region > base: logLevel set in all 3 layers, stage wins', () => {
    // base(base.json)='error', region(eu-west-1.json)='warn', stage(test.json)='debug'
    expect(stack.props.logLevel).toEqual('debug')
  })

  test('stage > region > base: resourcePrefix set in all 3 layers, stage wins', () => {
    // base(base.json)='ge', region(eu-west-1.json)='ge-eu-west-1', stage(test.json)='cdktest'
    expect(stack.props.resourcePrefix).toEqual('cdktest')
  })

  test('base only: globalPrefix set only in base, survives through region and stage', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })

  test('stage > region: subDomain set in region and stage, stage wins', () => {
    // region(eu-west-1.json)='eu', stage(test.json)='test'
    expect(stack.props.subDomain).toEqual('test')
  })

  test('stage > region: apiSubDomain set in region and stage, stage wins', () => {
    // region(eu-west-1.json)='api-eu', stage(test.json)='api'
    expect(stack.props.apiSubDomain).toEqual('api')
  })

  test('resource-level region > base: s3 buckets use eu-suffixed names from eu-west-1 region context', () => {
    // siteBucket.bucketName: base(buckets.json)='site', region(eu-west-1-buckets.json)='site-eu'
    // siteLogBucket.bucketName: base(buckets.json)='site-logs', region(eu-west-1-buckets.json)='site-logs-eu'
    // stage does not set siteBucket/siteLogBucket → region wins over base
    template.resourceCountIs('AWS::S3::Bucket', 2)

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'site-logs-eu-123456789-eu-west-1-test',
      AccessControl: 'LogDeliveryWrite',
    })

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'site-eu-123456789-eu-west-1-test',
      AccessControl: 'LogDeliveryWrite',
      WebsiteConfiguration: {
        ErrorDocument: 'index.html',
        IndexDocument: 'index.html',
      },
    })
  })
})
