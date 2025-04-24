import { ApiShield } from '@cdktf/provider-cloudflare/lib/api-shield'
import { ApiShieldOperation } from '@cdktf/provider-cloudflare/lib/api-shield-operation'
import { ApiShieldOperationSchemaValidationSettings } from '@cdktf/provider-cloudflare/lib/api-shield-operation-schema-validation-settings'
import { ApiShieldSchema } from '@cdktf/provider-cloudflare/lib/api-shield-schema'
import { ApiShieldSchemaValidationSettings } from '@cdktf/provider-cloudflare/lib/api-shield-schema-validation-settings'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import fs from 'fs'
import {
  ApiShieldOperationProps,
  ApiShieldOperationSchemaValidationSettingsProps,
  ApiShieldProps,
  ApiShieldSchemaProps,
  ApiShieldSchemaValidationSettingsProps,
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZoneProps,
} from '../../../lib'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testApiShield: ApiShieldProps
  testApiShieldSchema: ApiShieldSchemaProps
  testApiShieldSchemaValidationSettings: ApiShieldSchemaValidationSettingsProps
  testApiShieldOperation: ApiShieldOperationProps
  testApiShieldOperationSchemaValidationSettings: ApiShieldOperationSchemaValidationSettingsProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/cdkConfig/api-shield.json',
    'src/test/cloudflare/common/cdkConfig/dummy.json',
    'src/test/cloudflare/common/cdkConfig/zone.json',
  ],
  features: {},
  name: 'test-common-stack',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, testStackProps)
    this.construct = new TestCommonConstruct(this, props.name, this.props)
  }

  protected determineConstructProps(props: CommonCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      testApiShield: this.node.tryGetContext('testApiShield'),
      testApiShieldOperation: this.node.tryGetContext('testApiShieldOperation'),
      testApiShieldOperationSchemaValidationSettings: this.node.tryGetContext(
        'testApiShieldOperationSchemaValidationSettings'
      ),
      testApiShieldSchema: this.node.tryGetContext('testApiShieldSchema'),
      testApiShieldSchemaValidationSettings: this.node.tryGetContext('testApiShieldSchemaValidationSettings'),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testZone: this.node.tryGetContext('testZone'),
    }
  }
}

class TestInvalidCommonStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, testStackProps)
    this.construct = new TestCommonConstruct(this, props.name, this.props)
  }

  protected determineConstructProps(props: CommonCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      testApiShieldOperation: this.node.tryGetContext('testApiShieldOperation'),
      testApiShieldOperationSchemaValidationSettings: this.node.tryGetContext(
        'testApiShieldOperationSchemaValidationSettings'
      ),
      testApiShieldSchema: this.node.tryGetContext('testApiShieldSchema'),
      testApiShieldSchemaValidationSettings: this.node.tryGetContext('testApiShieldSchemaValidationSettings'),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testZone: this.node.tryGetContext('testZone'),
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, props)
    const zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.zoneManager.createZoneCacheReserve(`test-zone-cache-reserve-${this.props.stage}`, this, {
      zoneId: zone.id,
    })
    this.apiShieldManager.createApiShield(`test-api-shield-${this.props.stage}`, this, this.props.testApiShield)
    this.apiShieldManager.createApiShieldSchema(`test-api-shield-sch-${this.props.stage}`, this, {
      ...this.props.testApiShieldSchema,
      file: fs.readFileSync('src/test/cloudflare/common/sample.json', { encoding: 'utf8' }),
    })
    this.apiShieldManager.createApiShieldSchemaValidationSettings(
      `test-api-shield-val-${this.props.stage}`,
      this,
      this.props.testApiShieldSchemaValidationSettings
    )
    const apiOperation = this.apiShieldManager.createApiShieldOperation(
      `test-api-shield-op-${this.props.stage}`,
      this,
      this.props.testApiShieldOperation
    )
    this.apiShieldManager.createApiShieldOperationSchemaValidationSettings(
      `test-api-shield-op-val-${this.props.stage}`,
      this,
      {
        ...this.props.testApiShieldOperationSchemaValidationSettings,
        operationId: apiOperation.id,
      }
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflareApiShieldManager', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-api-shield-dev')
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testApiShieldDevApiShieldFriendlyUniqueId: { value: 'test-api-shield-dev' },
      testApiShieldDevApiShieldId: { value: '${cloudflare_api_shield.test-api-shield-dev.id}' },
      testApiShieldOpDevApiShieldOperationFriendlyUniqueId: { value: 'test-api-shield-op-dev' },
      testApiShieldOpDevApiShieldOperationId: {
        value: '${cloudflare_api_shield_operation.test-api-shield-op-dev.id}',
      },
      testApiShieldOpValDevApiShieldOperationSchemaValidationSettingsFriendlyUniqueId: {
        value: 'test-api-shield-op-val-dev',
      },
      testApiShieldOpValDevApiShieldOperationSchemaValidationSettingsId: {
        value: '${cloudflare_api_shield_operation_schema_validation_settings.test-api-shield-op-val-dev.id}',
      },
      testApiShieldSchDevApiShieldSchemaFriendlyUniqueId: { value: 'test-api-shield-sch-dev' },
      testApiShieldSchDevApiShieldSchemaId: {
        value: '${cloudflare_api_shield_schema.test-api-shield-sch-dev.schema_id}',
      },
      testApiShieldValDevApiShieldSchemaValidationSettingsFriendlyUniqueId: { value: 'test-api-shield-val-dev' },
      testApiShieldValDevApiShieldSchemaValidationSettingsId: {
        value: '${cloudflare_api_shield_schema_validation_settings.test-api-shield-val-dev.id}',
      },
      testZoneDevZoneFriendlyUniqueId: { value: 'test-zone-dev' },
      testZoneDevZoneId: { value: '${cloudflare_zone.test-zone-dev.id}' },
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.name}' },
    })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account: {
        id: 'test-account',
      },
      name: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('provisions api shield as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiShield, {
      auth_id_characteristics: [
        {
          name: 'test-api-shield',
          type: 'header',
        },
      ],
      zone_id: '${data.cloudflare_zone.test-api-shield-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('provisions api shield schema as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiShieldSchema, {
      file: '{\n  "test": true,\n  "hello": "world"\n}\n',
      kind: 'openapi_v3',
      name: 'test-api-dev',
      zone_id: '${data.cloudflare_zone.test-api-shield-sch-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('provisions api shield schema validation settings as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiShieldSchemaValidationSettings, {
      validation_default_mitigation_action: 'log',
      validation_override_mitigation_action: 'none',
      zone_id: '${data.cloudflare_zone.test-api-shield-val-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('provisions api shield operation as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiShieldOperation, {
      endpoint: '/product',
      host: 'api.gradientedge.io',
      method: 'GET',
      zone_id: '${data.cloudflare_zone.test-api-shield-op-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('provisions api shield operation schema validation settings as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiShieldOperationSchemaValidationSettings, {
      mitigation_action: 'block',
      operation_id: '${cloudflare_api_shield_operation.test-api-shield-op-dev.id}',
      zone_id: '${data.cloudflare_zone.test-api-shield-op-val-dev-data-zone-data-zone.id}',
    })
  })
})
