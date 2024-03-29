import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'

interface TestStackProps extends CommonStackProps {
  testBucket: any
  testDistribution: any
  testHostedZone: any
  testLogBucket: any
  testNewCertificate: any
  testNewHostedZone: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [
    'src/test/aws/common/cdkConfig/buckets.json',
    'src/test/aws/common/cdkConfig/certificates.json',
    'src/test/aws/common/cdkConfig/distributions.json',
    'src/test/aws/common/cdkConfig/routes.json',
  ],
  name: 'test-common-stack',
  region: 'eu-west-1',
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
        testDistribution: this.node.tryGetContext('siteDistribution'),
        testHostedZone: this.node.tryGetContext('testHostedZone'),
        testLogBucket: this.node.tryGetContext('siteLogBucket'),
        testNewCertificate: this.node.tryGetContext('testNewCertificate'),
        testNewHostedZone: this.node.tryGetContext('testNewHostedZone'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.route53Manager.createHostedZone('test-hosted-zone', this, this.props.testHostedZone)
    const testHostedZone = this.route53Manager.createHostedZone(
      'test-new-hosted-zone',
      this,
      this.props.testNewHostedZone
    )
    const testCertificate = this.acmManager.resolveCertificate(
      'test-new-certificate',
      this,
      this.props.testNewCertificate,
      testHostedZone
    )
    const testDomain = new apig.DomainName(this, 'test-domain', {
      certificate: testCertificate,
      domainName: this.fullyQualifiedDomainName,
    })
    const siteBucket = this.s3Manager.createS3Bucket('test-bucket', this, this.props.testBucket)
    const siteLogBucket = this.s3Manager.createS3Bucket('test-log-bucket', this, this.props.testLogBucket)
    const oai = this.cloudFrontManager.createOriginAccessIdentity('test-oai-bucket', this, siteBucket)
    const testDistribution = this.cloudFrontManager.createCloudFrontDistribution(
      'test-distribution',
      this,
      this.props.testDistribution,
      siteBucket,
      siteLogBucket,
      oai,
      testCertificate
    )
    this.route53Manager.createApiGatewayARecord('test-record-api', this, 'testapi', testDomain, testHostedZone)
    this.route53Manager.withHostedZoneFromFullyQualifiedDomainName('test-another-hosted-zone', this, true)
    this.route53Manager.createCloudFrontTargetARecord(
      'test-dist-arecord',
      this,
      testDistribution,
      testHostedZone,
      'testdist'
    )
    this.route53Manager.createCloudFrontTargetARecordV2(
      'test-dist-arecord-v2',
      this,
      testDistribution,
      testHostedZone,
      'testdist'
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestRoute53Construct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Route53::HostedZone', 1)
    template.resourceCountIs('AWS::ApiGateway::DomainName', 1)
    template.resourceCountIs('AWS::Route53::RecordSet', 3)
  })
})

describe('TestRoute53Construct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testHostedZoneHostedZoneId', {})
    template.hasOutput('testHostedZoneHostedZoneArn', {})
    template.hasOutput('testNewHostedZoneHostedZoneId', {})
    template.hasOutput('testNewHostedZoneHostedZoneArn', {})
    template.hasOutput('testRecordApiARecordDomainName', {})
    template.hasOutput('testAnotherHostedZoneHostedZoneId', {})
    template.hasOutput('testAnotherHostedZoneHostedZoneArn', {})
    template.hasOutput('testDistArecordARecordDomainName', {})
    template.hasOutput('testDistArecordV2ARecordDomainName', {})
  })
})

describe('TestRoute53Construct', () => {
  test('provisions new hosted zone as expected', () => {
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      HostedZoneConfig: {
        Comment: 'Hosted zone for gradientedge.io',
      },
      Name: 'gradientedge.io.',
    })
  })
})

describe('TestRoute53Construct', () => {
  test('provisions new api domain as expected', () => {
    template.hasResourceProperties('AWS::ApiGateway::DomainName', {
      DomainName: 'test.gradientedge.io',
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
    })
  })
})

describe('TestRoute53Construct', () => {
  test('provisions new a record as expected', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'testapi-test.gradientedge.io.',
      Type: 'A',
    })
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'testdist.gradientedge.io.',
      Type: 'A',
    })
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'testdist-test.gradientedge.io.',
      Type: 'A',
    })
  })
})
