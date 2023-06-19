import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../lib'

interface TestStackProps extends CommonStackProps {
  testIpSet: any
  testWebAcl: any
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
  extraContexts: ['src/test/common/cdkConfig/waf.json'],
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
        testIpSet: this.node.tryGetContext('testIpSet'),
        testWebAcl: this.node.tryGetContext('testWebAcl'),
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
        testIpSet: this.node.tryGetContext('testIpSet'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.wafManager.createIpSet('test-ip-set', this, this.props.testIpSet)
    this.wafManager.createWebAcl('test-web-acl', this, this.props.testWebAcl)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestWafConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('WAF WebACL props undefined')
  })
})

describe('TestWafConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::WAFv2::IPSet', 1)
    template.resourceCountIs('AWS::WAFv2::WebACL', 1)
  })
})

describe('TestWafConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testIpSetIpSetId', {})
    template.hasOutput('testIpSetIpSetArn', {})
    template.hasOutput('testWebAclWebAclId', {})
    template.hasOutput('testWebAclWebAclArn', {})
  })
})

describe('TestWafConstruct', () => {
  test('provisions new ip set as expected', () => {
    template.hasResourceProperties('AWS::WAFv2::IPSet', {
      Addresses: ['0.0.0.0/32'],
      IPAddressVersion: 'IPV4',
      Scope: 'REGIONAL',
      Description: 'IP Set for test-ip-set - test stage',
      Name: 'test-ipset-test',
    })
  })
})

describe('TestWafConstruct', () => {
  test('provisions new web acl as expected', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      DefaultAction: {
        Allow: {},
        Block: {},
      },
      Scope: 'CLOUDFRONT',
      VisibilityConfig: {
        CloudWatchMetricsEnabled: true,
        MetricName: 'test-metric',
        SampledRequestsEnabled: false,
      },
      Description: 'Web Acl for test-web-acl - test stage',
      Name: 'test-webacl-test',
      Tags: [
        {
          Key: 'service',
          Value: 'test',
        },
      ],
    })
  })
})
