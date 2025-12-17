import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps, KmsKeyProps } from '../../../lib/aws/index.js'

interface TestStackProps extends CommonStackProps {
  testKmsKey: KmsKeyProps
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/kms.json'],
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
        testKmsKey: this.node.tryGetContext('testKmsKey'),
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
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.kmsManager.createKey('testKey', this, this.props.testKmsKey)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestKmsConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('KMS Key props undefined')
  })
})

describe('TestKmsConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testKmsKey')
    expect(commonStack.props.testKmsKey.enableKeyRotation).toEqual(true)
  })
})

describe('TestKmsConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::KMS::Key', 1)
  })
})

describe('TestKmsConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testKeyKeyId', {})
    template.hasOutput('testKeyKeyArn', {})
  })
})

describe('TestKmsConstruct', () => {
  test('provisions new kms key as expected', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      KeyPolicy: {
        Statement: [
          {
            Action: 'kms:*',
            Effect: 'Allow',
            Principal: {
              AWS: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::123456789:root',
                  ],
                ],
              },
            },
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
    })
  })
})
