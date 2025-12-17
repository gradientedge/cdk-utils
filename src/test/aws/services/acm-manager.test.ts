import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { AcmProps, CommonConstruct, CommonStack, CommonStackProps } from '../../../lib/aws/index.js'

interface TestStackProps extends CommonStackProps {
  testCertificate: AcmProps
  testNewCertificate: AcmProps
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/certificates.json'],
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
        testCertificate: this.node.tryGetContext('siteCertificate'),
        testNewCertificate: this.node.tryGetContext('testNewCertificate'),
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
        testNewCertificate: this.node.tryGetContext('testNewCertificate'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const hostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName('test-hosted-zone', this, true)
    this.acmManager.resolveCertificate('test-certificate', this, this.props.testCertificate)
    this.acmManager.resolveCertificate('test-new-certificate', this, this.props.testNewCertificate, hostedZone)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestAcmConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Certificate props undefined')
  })
})

describe('TestAcmConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testCertificate')
    expect(commonStack.props.testCertificate.certificateRegion).toEqual('us-east-1')
  })
})

describe('TestAcmConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1)
  })
})

describe('TestAcmConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testHostedZoneHostedZoneId', {})
    template.hasOutput('testHostedZoneHostedZoneArn', {})
    template.hasOutput('testCertificateCertificateArn', {})
    template.hasOutput('testNewCertificateCertificateArn', {})
  })
})

describe('TestAcmConstruct', () => {
  test('provisions new certificate as expected', () => {
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: 'gradientedge.io',
      DomainValidationOptions: [
        {
          DomainName: 'gradientedge.io',
          HostedZoneId: 'DUMMY',
        },
      ],
      SubjectAlternativeNames: ['*.gradientedge.io'],
      ValidationMethod: 'DNS',
    })
  })
})
