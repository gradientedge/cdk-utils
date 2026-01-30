import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { describe, expect, test, vi } from 'vitest'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib/aws/index.js'

interface TestStackProps extends CommonStackProps {}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: [],
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
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.secretsManager.createSecret('test-secret', this, {
      secretName: 'test-secret-name',
      description: 'Test secret description',
    })

    this.secretsManager.retrieveSecretFromSecretsManager(
      'test-retrieved-secret',
      this,
      'test-stack-name',
      'test-export-name'
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestSecretsManagerConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::SecretsManager::Secret', 1)
  })
})

describe('TestSecretsManagerConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testSecretSecretName', {})
    template.hasOutput('testSecretSecretArn', {})
  })
})

describe('TestSecretsManagerConstruct', () => {
  test('provisions new secret as expected', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Description: 'Test secret description',
      Name: 'cdktest-test-secret-name-test',
    })
  })
})

describe('TestSecretsManagerConstruct', () => {
  test('handles missing props', () => {
    const app = new cdk.App({ context: testStackProps })
    const stack = new CommonStack(app, 'test-stack', testStackProps)
    const construct = new CommonConstruct(stack, 'test-construct', testStackProps)

    expect(() => {
      construct.secretsManager.createSecret('test-secret-no-props', construct, undefined as any)
    }).toThrow('Secret props undefined for test-secret-no-props')
  })

  test('handles missing secret name', () => {
    const app = new cdk.App({ context: testStackProps })
    const stack = new CommonStack(app, 'test-stack', testStackProps)
    const construct = new CommonConstruct(stack, 'test-construct', testStackProps)

    expect(() => {
      construct.secretsManager.createSecret('test-secret-no-name', construct, {} as any)
    }).toThrow('Secret name undefined for test-secret-no-name')
  })
})

describe('TestSecretsManagerResolveValue', () => {
  test('resolves secret value successfully', async () => {
    const app = new cdk.App({ context: testStackProps })
    const stack = new CommonStack(app, 'test-stack', testStackProps)
    const construct = new CommonConstruct(stack, 'test-construct', testStackProps)

    const mockSend = vi.fn().mockResolvedValue({
      SecretString: JSON.stringify({ testKey: 'testValue' }),
    })

    vi.spyOn(SecretsManagerClient.prototype, 'send').mockImplementation(mockSend)

    const result = await construct.secretsManager.resolveSecretValue('eu-west-1', 'test-secret-id', 'testKey')

    expect(result).toBe('testValue')
    expect(mockSend).toHaveBeenCalledWith(expect.any(GetSecretValueCommand))
  })

  test('throws error when SecretString is undefined', async () => {
    const app = new cdk.App({ context: testStackProps })
    const stack = new CommonStack(app, 'test-stack', testStackProps)
    const construct = new CommonConstruct(stack, 'test-construct', testStackProps)

    const mockSend = vi.fn().mockResolvedValue({
      SecretString: undefined,
    })

    vi.spyOn(SecretsManagerClient.prototype, 'send').mockImplementation(mockSend)

    await expect(construct.secretsManager.resolveSecretValue('eu-west-1', 'test-secret-id', 'testKey')).rejects.toThrow(
      'Unable to resolve secret for test-secret-id'
    )
  })
})
