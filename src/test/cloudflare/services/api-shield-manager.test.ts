import {
  ApiShield,
  ApiShieldOperation,
  ApiShieldOperationSchemaValidationSettings,
  ApiShieldSchema,
  ApiShieldSchemaValidationSettings,
  Zone,
} from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
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
} from '../../../lib/cloudflare/index.js'

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
    'src/test/cloudflare/common/config/api-shield.json',
    'src/test/cloudflare/common/config/dummy.json',
    'src/test/cloudflare/common/config/zone.json',
  ],
  features: {},
  name: 'test-common-stack',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/cloudflare/common/env',
}

class TestCommonCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

class TestInvalidCommonCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }

  protected determineConstructProps(props: CommonCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      testApiShield: undefined,
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  apiShield: ApiShield
  apiShieldSchema: ApiShieldSchema
  apiShieldSchemaValidationSettings: ApiShieldSchemaValidationSettings
  apiShieldOperation: ApiShieldOperation
  apiShieldOperationSchemaValidationSettings: ApiShieldOperationSchemaValidationSettings

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.zoneManager.createZoneCacheReserve(`test-zone-cache-reserve-${this.props.stage}`, this, {
      zoneId: this.zone.id,
    })
    this.apiShield = this.apiShieldManager.createApiShield(
      `test-api-shield-${this.props.stage}`,
      this,
      this.props.testApiShield
    )
    this.apiShieldSchema = this.apiShieldManager.createApiShieldSchema(
      `test-api-shield-sch-${this.props.stage}`,
      this,
      {
        ...this.props.testApiShieldSchema,
        file: fs.readFileSync('src/test/cloudflare/common/sample.json', { encoding: 'utf8' }),
      }
    )
    this.apiShieldSchemaValidationSettings = this.apiShieldManager.createApiShieldSchemaValidationSettings(
      `test-api-shield-val-${this.props.stage}`,
      this,
      this.props.testApiShieldSchemaValidationSettings
    )
    this.apiShieldOperation = this.apiShieldManager.createApiShieldOperation(
      `test-api-shield-op-${this.props.stage}`,
      this,
      this.props.testApiShieldOperation
    )
    this.apiShieldOperationSchemaValidationSettings =
      this.apiShieldManager.createApiShieldOperationSchemaValidationSettings(
        `test-api-shield-op-val-${this.props.stage}`,
        this,
        {
          ...this.props.testApiShieldOperationSchemaValidationSettings,
          operationId: this.apiShieldOperation.id,
        }
      )
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

let stack = new TestCommonCloudflareStack('test-stack', testStackProps)

describe('TestCloudflareApiShieldManager', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflareApiShieldManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
    pulumi.all([stack.urn]).apply(([urn]) => {
      expect(urn).toEqual('urn:pulumi:stack::project::custom:cloudflare:Stack:test-stack::test-stack')
    })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  expect(stack.construct.zone).toBeDefined()
  test('provisions zone as expected', () => {
    pulumi
      .all([stack.construct.zone.id, stack.construct.zone.urn, stack.construct.zone.name, stack.construct.zone.account])
      .apply(([id, urn, name, account]) => {
        expect(id).toEqual('test-zone-dev-id')
        expect(urn).toEqual('urn:pulumi:stack::project::cloudflare:index/zone:Zone::test-zone-dev')
        expect(name).toEqual('gradientedge.io')
        expect(account.id).toEqual('test-account')
      })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  expect(stack.construct.apiShield).toBeDefined()
  test('provisions api shield as expected', () => {
    pulumi
      .all([
        stack.construct.apiShield.id,
        stack.construct.apiShield.urn,
        stack.construct.apiShield.authIdCharacteristics,
        stack.construct.apiShield.zoneId,
      ])
      .apply(([id, urn, authIdCharacteristics, zoneId]) => {
        expect(id).toEqual('test-api-shield-dev-id')
        expect(urn).toEqual('urn:pulumi:stack::project::cloudflare:index/apiShield:ApiShield::test-api-shield-dev')
        expect(authIdCharacteristics).toEqual([
          {
            name: 'test-api-shield',
            type: 'header',
          },
        ])
        expect(zoneId).toEqual('test-api-shield-dev-data-zone')
      })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  expect(stack.construct.apiShieldSchema).toBeDefined()
  test('provisions api shield schema as expected', () => {
    pulumi
      .all([
        stack.construct.apiShieldSchema.id,
        stack.construct.apiShieldSchema.urn,
        stack.construct.apiShieldSchema.file,
        stack.construct.apiShieldSchema.kind,
        stack.construct.apiShieldSchema.name,
        stack.construct.apiShieldSchema.zoneId,
      ])
      .apply(([id, urn, file, kind, name, zoneId]) => {
        expect(id).toEqual('test-api-shield-sch-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/apiShieldSchema:ApiShieldSchema::test-api-shield-sch-dev'
        )
        expect(file).toEqual('{\n  "test": true,\n  "hello": "world"\n}\n')
        expect(kind).toEqual('openapi_v3')
        expect(name).toEqual('test-api-dev')
        expect(zoneId).toEqual('test-api-shield-sch-dev-data-zone')
      })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  expect(stack.construct.apiShieldSchemaValidationSettings).toBeDefined()
  test('provisions api shield schema validation settings as expected', () => {
    pulumi
      .all([
        stack.construct.apiShieldSchemaValidationSettings.id,
        stack.construct.apiShieldSchemaValidationSettings.urn,
        stack.construct.apiShieldSchemaValidationSettings.validationDefaultMitigationAction,
        stack.construct.apiShieldSchemaValidationSettings.validationOverrideMitigationAction,
        stack.construct.apiShieldSchemaValidationSettings.zoneId,
      ])
      .apply(([id, urn, validationDefaultMitigationAction, validationOverrideMitigationAction, zoneId]) => {
        expect(id).toEqual('test-api-shield-val-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/apiShieldSchemaValidationSettings:ApiShieldSchemaValidationSettings::test-api-shield-val-dev'
        )
        expect(validationDefaultMitigationAction).toEqual('log')
        expect(validationOverrideMitigationAction).toEqual('none')
        expect(zoneId).toEqual('test-api-shield-val-dev-data-zone')
      })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  expect(stack.construct.apiShieldOperation).toBeDefined()
  test('provisions api shield operation as expected', () => {
    pulumi
      .all([
        stack.construct.apiShieldOperation.id,
        stack.construct.apiShieldOperation.urn,
        stack.construct.apiShieldOperation.endpoint,
        stack.construct.apiShieldOperation.host,
        stack.construct.apiShieldOperation.method,
        stack.construct.apiShieldOperation.zoneId,
      ])
      .apply(([id, urn, endpoint, host, method, zoneId]) => {
        expect(id).toEqual('test-api-shield-op-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/apiShieldOperation:ApiShieldOperation::test-api-shield-op-dev'
        )
        expect(endpoint).toEqual('/product')
        expect(host).toEqual('api.gradientedge.io')
        expect(method).toEqual('GET')
        expect(zoneId).toEqual('test-api-shield-op-dev-data-zone')
      })
  })
})

describe('TestCloudflareApiShieldManager', () => {
  expect(stack.construct.apiShieldOperationSchemaValidationSettings).toBeDefined()
  test('provisions api shield operation schema validation settings as expected', () => {
    pulumi
      .all([
        stack.construct.apiShieldOperationSchemaValidationSettings.id,
        stack.construct.apiShieldOperationSchemaValidationSettings.urn,
        stack.construct.apiShieldOperationSchemaValidationSettings.mitigationAction,
        stack.construct.apiShieldOperationSchemaValidationSettings.operationId,
        stack.construct.apiShieldOperationSchemaValidationSettings.zoneId,
      ])
      .apply(([id, urn, mitigationAction, operationId, zoneId]) => {
        expect(id).toEqual('test-api-shield-op-val-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/apiShieldOperationSchemaValidationSettings:ApiShieldOperationSchemaValidationSettings::test-api-shield-op-val-dev'
        )
        expect(mitigationAction).toEqual('block')
        expect(operationId).toEqual('test-api-shield-op-dev-id')
        expect(zoneId).toEqual('test-api-shield-op-val-dev-data-zone')
      })
  })
})
