import { AccessApplication } from '@cdktf/provider-cloudflare/lib/access-application'
import { AccessCaCertificate } from '@cdktf/provider-cloudflare/lib/access-ca-certificate'
import { AccessCustomPage } from '@cdktf/provider-cloudflare/lib/access-custom-page'
import { AccessGroup } from '@cdktf/provider-cloudflare/lib/access-group'
import { AccessIdentityProvider } from '@cdktf/provider-cloudflare/lib/access-identity-provider'
import { AccessMutualTlsCertificate } from '@cdktf/provider-cloudflare/lib/access-mutual-tls-certificate'
import { ApiShield } from '@cdktf/provider-cloudflare/lib/api-shield'
import { ApiShieldOperation } from '@cdktf/provider-cloudflare/lib/api-shield-operation'
import { ApiShieldOperationSchemaValidationSettings } from '@cdktf/provider-cloudflare/lib/api-shield-operation-schema-validation-settings'
import { ApiShieldSchema } from '@cdktf/provider-cloudflare/lib/api-shield-schema'
import { ApiShieldSchemaValidationSettings } from '@cdktf/provider-cloudflare/lib/api-shield-schema-validation-settings'
import { Filter } from '@cdktf/provider-cloudflare/lib/filter'
import { FirewallRule } from '@cdktf/provider-cloudflare/lib/firewall-rule'
import { WorkerCronTrigger } from '@cdktf/provider-cloudflare/lib/worker-cron-trigger'
import { WorkerDomain } from '@cdktf/provider-cloudflare/lib/worker-domain'
import { WorkerRoute } from '@cdktf/provider-cloudflare/lib/worker-route'
import { WorkerScript, WorkerScriptWebassemblyBinding } from '@cdktf/provider-cloudflare/lib/worker-script'
import { WorkersKv } from '@cdktf/provider-cloudflare/lib/workers-kv'
import { WorkersKvNamespace } from '@cdktf/provider-cloudflare/lib/workers-kv-namespace'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { ZoneCacheReserve } from '@cdktf/provider-cloudflare/lib/zone-cache-reserve'
import { ZoneCacheVariants } from '@cdktf/provider-cloudflare/lib/zone-cache-variants'
import { ZoneDnssec } from '@cdktf/provider-cloudflare/lib/zone-dnssec'
import { ZoneHold } from '@cdktf/provider-cloudflare/lib/zone-hold'
import { ZoneLockdown } from '@cdktf/provider-cloudflare/lib/zone-lockdown'
import { ZoneSettingsOverride } from '@cdktf/provider-cloudflare/lib/zone-settings-override'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import fs from 'fs'
import {
  AccessApplicationProps,
  AccessCustomPageProps,
  AccessGroupProps,
  AccessIdentityProviderProps,
  AccessMutualTlsCertificateProps,
  AccessOrganizationProps,
  AccessPolicyProps,
  AccessRuleProps,
  AccessServiceTokenProps,
  AccessTagProps,
  ApiShieldOperationProps,
  ApiShieldOperationSchemaValidationSettingsProps,
  ApiShieldProps,
  ApiShieldSchemaProps,
  ApiShieldSchemaValidationSettingsProps,
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  FilterProps,
  WorkerCronTriggerProps,
  WorkerDomainProps,
  WorkerRouteProps,
  WorkerScriptProps,
  WorkersKvNamespaceProps,
  WorkersKvProps,
  ZoneCacheVariantsProps,
  ZoneLockdownProps,
  ZoneProps,
  ZoneSettingsOverrideProps,
} from '../../../lib'
import { FirewallRuleProps } from '../../../lib/cloudflare/services/firewall'
import { AccessOrganization } from '@cdktf/provider-cloudflare/lib/access-organization'
import { AccessPolicy } from '@cdktf/provider-cloudflare/lib/access-policy'
import { AccessRule } from '@cdktf/provider-cloudflare/lib/access-rule'
import { AccessServiceToken } from '@cdktf/provider-cloudflare/lib/access-service-token'
import { AccessTag } from '@cdktf/provider-cloudflare/lib/access-tag'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testZoneCacheVariants: ZoneCacheVariantsProps
  testZoneLockdown: ZoneLockdownProps
  testZoneSettingsOverride: ZoneSettingsOverrideProps
  testWorkerDomain: WorkerDomainProps
  testWorkerRoute: WorkerRouteProps
  testWorkerScript: WorkerScriptProps
  testWorkersKvNamespace: WorkersKvNamespaceProps
  testWorkersKv: WorkersKvProps
  testWorkerCronTrigger: WorkerCronTriggerProps
  testApiShield: ApiShieldProps
  testApiShieldSchema: ApiShieldSchemaProps
  testApiShieldSchemaValidationSettings: ApiShieldSchemaValidationSettingsProps
  testApiShieldOperation: ApiShieldOperationProps
  testApiShieldOperationSchemaValidationSettings: ApiShieldOperationSchemaValidationSettingsProps
  testFilter: FilterProps
  testFirewallRule: FirewallRuleProps
  testAccessApplication: AccessApplicationProps
  testAccessCustomPage: AccessCustomPageProps
  testAccessGroup: AccessGroupProps
  testAccessOTPIdentityProvider: AccessIdentityProviderProps
  testAccessSamlIdentityProvider: AccessIdentityProviderProps
  testAccessMTlsCertificate: AccessMutualTlsCertificateProps
  testAccessOrganisation: AccessOrganizationProps
  testAccessPolicy: AccessPolicyProps
  testAccessRuleChallenge: AccessRuleProps
  testAccessRuleWhitelist: AccessRuleProps
  testAccessServiceToken: AccessServiceTokenProps
  testAccessTag: AccessTagProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/cdkConfig/access.json',
    'src/test/cloudflare/common/cdkConfig/api-shield.json',
    'src/test/cloudflare/common/cdkConfig/dummy.json',
    'src/test/cloudflare/common/cdkConfig/filter.json',
    'src/test/cloudflare/common/cdkConfig/worker.json',
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
      testAccessApplication: this.node.tryGetContext('testAccessApplication'),
      testAccessCustomPage: this.node.tryGetContext('testAccessCustomPage'),
      testAccessGroup: this.node.tryGetContext('testAccessGroup'),
      testAccessMTlsCertificate: this.node.tryGetContext('testAccessMTlsCertificate'),
      testAccessOTPIdentityProvider: this.node.tryGetContext('testAccessOTPIdentityProvider'),
      testAccessOrganisation: this.node.tryGetContext('testAccessOrganisation'),
      testAccessPolicy: this.node.tryGetContext('testAccessPolicy'),
      testAccessRuleChallenge: this.node.tryGetContext('testAccessRuleChallenge'),
      testAccessRuleWhitelist: this.node.tryGetContext('testAccessRuleWhitelist'),
      testAccessSamlIdentityProvider: this.node.tryGetContext('testAccessSamlIdentityProvider'),
      testAccessServiceToken: this.node.tryGetContext('testAccessServiceToken'),
      testAccessTag: this.node.tryGetContext('testAccessTag'),
      testApiShield: this.node.tryGetContext('testApiShield'),
      testApiShieldOperation: this.node.tryGetContext('testApiShieldOperation'),
      testApiShieldOperationSchemaValidationSettings: this.node.tryGetContext(
        'testApiShieldOperationSchemaValidationSettings'
      ),
      testApiShieldSchema: this.node.tryGetContext('testApiShieldSchema'),
      testApiShieldSchemaValidationSettings: this.node.tryGetContext('testApiShieldSchemaValidationSettings'),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testFilter: this.node.tryGetContext('testFilter'),
      testFirewallRule: this.node.tryGetContext('testFirewallRule'),
      testWorkerCronTrigger: this.node.tryGetContext('testWorkerCronTrigger'),
      testWorkerDomain: this.node.tryGetContext('testWorkerDomain'),
      testWorkerRoute: this.node.tryGetContext('testWorkerRoute'),
      testWorkerScript: this.node.tryGetContext('testWorkerScript'),
      testWorkersKv: this.node.tryGetContext('testWorkersKv'),
      testWorkersKvNamespace: this.node.tryGetContext('testWorkersKvNamespace'),
      testZone: this.node.tryGetContext('testZone'),
      testZoneCacheVariants: this.node.tryGetContext('testZoneCacheVariants'),
      testZoneLockdown: this.node.tryGetContext('testZoneLockdown'),
      testZoneSettingsOverride: this.node.tryGetContext('testZoneSettingsOverride'),
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, props)
    const zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.zoneManager.createZoneCacheReserve(`test-zone-cache-reserve-${this.props.stage}`, this, {
      enabled: true,
      zoneId: zone.id,
    })
    this.zoneManager.createZoneCacheVariants(`test-zone-cache-variants-${this.props.stage}`, this, {
      ...this.props.testZoneCacheVariants,
    })
    this.zoneManager.createZoneDnssec(`test-zone-dnssec-${this.props.stage}`, this, {
      zoneId: zone.id,
    })
    this.zoneManager.createZoneHold(`test-zone-hold-${this.props.stage}`, this, {
      hold: true,
      zoneId: zone.id,
    })
    this.zoneManager.createZoneLockdown(`test-zone-lockdown-${this.props.stage}`, this, this.props.testZoneLockdown)
    this.zoneManager.createZoneSettingsOverride(
      `test-zone-settings-${this.props.stage}`,
      this,
      this.props.testZoneSettingsOverride
    )
    this.workerManager.createWorkerDomain(`test-worker-domain-${this.props.stage}`, this, this.props.testWorkerDomain)
    this.workerManager.createWorkerRoute(`test-worker-route-${this.props.stage}`, this, this.props.testWorkerRoute)
    const testScript = this.workerManager.createWorkerScript(`test-worker-script-${this.props.stage}`, this, {
      ...this.props.testWorkerScript,
      content: fs.readFileSync('src/test/cloudflare/common/sample.js', { encoding: 'utf8' }),
      webassemblyBinding: (this.props.testWorkerScript.webassemblyBinding as WorkerScriptWebassemblyBinding[]).map(
        (binding: WorkerScriptWebassemblyBinding) => {
          return {
            ...binding,
            module: fs.readFileSync('src/test/cloudflare/common/sample.wasm', { encoding: 'base64' }),
          }
        }
      ),
    })
    const workerKvNsId = this.workerManager.createWorkersKvNamespace(
      `test-workers-kv-ns-${this.props.stage}`,
      this,
      this.props.testWorkersKvNamespace
    )
    this.workerManager.createWorkersKv(`test-workers-kv-${this.props.stage}`, this, {
      ...this.props.testWorkersKv,
      namespaceId: workerKvNsId.id,
    })
    this.workerManager.createWorkerCronTrigger(
      `test-worker-trigger-${this.props.stage}`,
      this,
      this.props.testWorkerCronTrigger
    )
    this.apiShieldManager.createApiShield(`test-api-shield-${this.props.stage}`, this, this.props.testApiShield)
    this.apiShieldManager.createApiShieldSchema(`test-api-shield-sch-${this.props.stage}`, this, {
      ...this.props.testApiShieldSchema,
      source: fs.readFileSync('src/test/cloudflare/common/sample.json', { encoding: 'utf8' }),
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
    const filter = this.filterManager.createApiShield(`test-filter-${this.props.stage}`, this, this.props.testFilter)
    this.firewallManager.createFirewallRule(`test-firewall-rule-${this.props.stage}`, this, {
      ...this.props.testFirewallRule,
      filterId: filter.id,
    })
    const accessApp = this.accessManager.createAccessApplication(
      `test-access-app-${this.props.stage}`,
      this,
      this.props.testAccessApplication
    )
    this.accessManager.createAccessCaCertificate(`test-access-ca-cert-${this.props.stage}`, this, {
      applicationId: accessApp.id,
    })
    this.accessManager.createAccessCustomPage(`test-access-custom-page-${this.props.stage}`, this, {
      ...this.props.testAccessCustomPage,
      customHtml: fs.readFileSync('src/test/cloudflare/common/sample.html', { encoding: 'utf8' }),
    })
    this.accessManager.createAccessGroup(`test-access-grp-${this.props.stage}`, this, this.props.testAccessGroup)
    this.accessManager.createAccessIdentityProvider(
      `test-access-idp-otp-${this.props.stage}`,
      this,
      this.props.testAccessOTPIdentityProvider
    )
    this.accessManager.createAccessIdentityProvider(
      `test-access-idp-saml-${this.props.stage}`,
      this,
      this.props.testAccessSamlIdentityProvider
    )
    this.accessManager.createAccessMutualTlsCertificate(`test-access-mtls-${this.props.stage}`, this, {
      ...this.props.testAccessMTlsCertificate,
      certificate: fs.readFileSync('src/test/cloudflare/common/sample.pem', { encoding: 'utf8' }),
    })
    this.accessManager.createAccessOrganization(
      `test-access-org-${this.props.stage}`,
      this,
      this.props.testAccessOrganisation
    )
    this.accessManager.createAccessPolicy(`test-access-policy-${this.props.stage}`, this, this.props.testAccessPolicy)
    this.accessManager.createAccessRule(
      `test-access-rule-ch-${this.props.stage}`,
      this,
      this.props.testAccessRuleChallenge
    )
    this.accessManager.createAccessRule(
      `test-access-rule-wl-${this.props.stage}`,
      this,
      this.props.testAccessRuleWhitelist
    )
    this.accessManager.createAccessServiceToken(
      `test-access-ser-token-${this.props.stage}`,
      this,
      this.props.testAccessServiceToken
    )
    this.accessManager.createAccessTag(`test-access-tag-${this.props.stage}`, this, this.props.testAccessTag)
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflareCommonConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testAccessAppDevAccessApplicationFriendlyUniqueId: { value: 'test-access-app-dev' },
      testAccessAppDevAccessApplicationId: { value: '${cloudflare_access_application.test-access-app-dev.id}' },
      testAccessCaCertDevAccessCaCertificateFriendlyUniqueId: { value: 'test-access-ca-cert-dev' },
      testAccessCaCertDevAccessCaCertificateId: {
        value: '${cloudflare_access_ca_certificate.test-access-ca-cert-dev.id}',
      },
      testAccessCustomPageDevAccessCustomPageFriendlyUniqueId: { value: 'test-access-custom-page-dev' },
      testAccessCustomPageDevAccessCustomPageId: {
        value: '${cloudflare_access_custom_page.test-access-custom-page-dev.id}',
      },
      testAccessGrpDevAccessGroupFriendlyUniqueId: { value: 'test-access-grp-dev' },
      testAccessGrpDevAccessGroupId: { value: '${cloudflare_access_group.test-access-grp-dev.id}' },
      testAccessIdpOtpDevAccessIdentityProviderFriendlyUniqueId: { value: 'test-access-idp-otp-dev' },
      testAccessIdpOtpDevAccessIdentityProviderId: {
        value: '${cloudflare_access_identity_provider.test-access-idp-otp-dev.id}',
      },
      testAccessIdpSamlDevAccessIdentityProviderFriendlyUniqueId: { value: 'test-access-idp-saml-dev' },
      testAccessIdpSamlDevAccessIdentityProviderId: {
        value: '${cloudflare_access_identity_provider.test-access-idp-saml-dev.id}',
      },
      testAccessMtlsDevAccessMutualTlsCertificateFriendlyUniqueId: { value: 'test-access-mtls-dev' },
      testAccessMtlsDevAccessMutualTlsCertificateId: {
        value: '${cloudflare_access_mutual_tls_certificate.test-access-mtls-dev.id}',
      },
      testAccessOrgDevAccessOrganizationFriendlyUniqueId: { value: 'test-access-org-dev' },
      testAccessOrgDevAccessOrganizationId: { value: '${cloudflare_access_organization.test-access-org-dev.id}' },
      testAccessPolicyDevAccessPolicyFriendlyUniqueId: { value: 'test-access-policy-dev' },
      testAccessPolicyDevAccessPolicyId: { value: '${cloudflare_access_policy.test-access-policy-dev.id}' },
      testAccessRuleChDevAccessRuleFriendlyUniqueId: { value: 'test-access-rule-ch-dev' },
      testAccessRuleChDevAccessRuleId: { value: '${cloudflare_access_rule.test-access-rule-ch-dev.id}' },
      testAccessRuleWlDevAccessRuleFriendlyUniqueId: { value: 'test-access-rule-wl-dev' },
      testAccessRuleWlDevAccessRuleId: { value: '${cloudflare_access_rule.test-access-rule-wl-dev.id}' },
      testAccessSerTokenDevAccessServiceTokenFriendlyUniqueId: { value: 'test-access-ser-token-dev' },
      testAccessSerTokenDevAccessServiceTokenId: {
        value: '${cloudflare_access_service_token.test-access-ser-token-dev.id}',
      },
      testAccessTagDevAccessTagFriendlyUniqueId: { value: 'test-access-tag-dev' },
      testAccessTagDevAccessTagId: { value: '${cloudflare_access_tag.test-access-tag-dev.id}' },
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
        value: '${cloudflare_api_shield_schema.test-api-shield-sch-dev.id}',
      },
      testApiShieldValDevApiShieldSchemaValidationSettingsFriendlyUniqueId: { value: 'test-api-shield-val-dev' },
      testApiShieldValDevApiShieldSchemaValidationSettingsId: {
        value: '${cloudflare_api_shield_schema_validation_settings.test-api-shield-val-dev.id}',
      },
      testFilterDevFilterFriendlyUniqueId: { value: 'test-filter-dev' },
      testFilterDevFilterId: { value: '${cloudflare_filter.test-filter-dev.id}' },
      testFirewallRuleDevFirewallRuleFriendlyUniqueId: { value: 'test-firewall-rule-dev' },
      testFirewallRuleDevFirewallRuleId: { value: '${cloudflare_firewall_rule.test-firewall-rule-dev.id}' },
      testWorkerDomainDevWorkerDomainFriendlyUniqueId: { value: 'test-worker-domain-dev' },
      testWorkerDomainDevWorkerDomainId: { value: '${cloudflare_worker_domain.test-worker-domain-dev.id}' },
      testWorkerRouteDevWorkerRouteFriendlyUniqueId: { value: 'test-worker-route-dev' },
      testWorkerRouteDevWorkerRouteId: { value: '${cloudflare_worker_route.test-worker-route-dev.id}' },
      testWorkerScriptDevWorkerScriptFriendlyUniqueId: { value: 'test-worker-script-dev' },
      testWorkerScriptDevWorkerScriptId: { value: '${cloudflare_worker_script.test-worker-script-dev.id}' },
      testWorkerTriggerDevWorkerCronTriggerFriendlyUniqueId: { value: 'test-worker-trigger-dev' },
      testWorkerTriggerDevWorkerCronTriggerId: {
        value: '${cloudflare_worker_cron_trigger.test-worker-trigger-dev.id}',
      },
      testWorkersKvDevWorkersKvFriendlyUniqueId: { value: 'test-workers-kv-dev' },
      testWorkersKvDevWorkersKvId: { value: '${cloudflare_workers_kv.test-workers-kv-dev.id}' },
      testWorkersKvNsDevWorkersKvNamespaceFriendlyUniqueId: { value: 'test-workers-kv-ns-dev' },
      testWorkersKvNsDevWorkersKvNamespaceId: {
        value: '${cloudflare_workers_kv_namespace.test-workers-kv-ns-dev.id}',
      },
      testZoneCacheReserveDevZoneCacheReserveFriendlyUniqueId: { value: 'test-zone-cache-reserve-dev' },
      testZoneCacheReserveDevZoneCacheReserveId: {
        value: '${cloudflare_zone_cache_reserve.test-zone-cache-reserve-dev.id}',
      },
      testZoneCacheVariantsDevZoneCacheVariantsFriendlyUniqueId: { value: 'test-zone-cache-variants-dev' },
      testZoneCacheVariantsDevZoneCacheVariantsId: {
        value: '${cloudflare_zone_cache_variants.test-zone-cache-variants-dev.id}',
      },
      testZoneDevZoneFriendlyUniqueId: { value: 'test-zone-dev' },
      testZoneDevZoneId: { value: '${cloudflare_zone.test-zone-dev.id}' },
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.zone}' },
      testZoneDnssecDevZoneDnssecFriendlyUniqueId: { value: 'test-zone-dnssec-dev' },
      testZoneDnssecDevZoneDnssecId: { value: '${cloudflare_zone_dnssec.test-zone-dnssec-dev.id}' },
      testZoneHoldDevZoneHoldFriendlyUniqueId: { value: 'test-zone-hold-dev' },
      testZoneHoldDevZoneHoldId: { value: '${cloudflare_zone_hold.test-zone-hold-dev.id}' },
      testZoneLockdownDevZoneLockdownFriendlyUniqueId: { value: 'test-zone-lockdown-dev' },
      testZoneLockdownDevZoneLockdownId: { value: '${cloudflare_zone_lockdown.test-zone-lockdown-dev.id}' },
      testZoneSettingsDevZoneSettingsOverrideFriendlyUniqueId: { value: 'test-zone-settings-dev' },
      testZoneSettingsDevZoneSettingsOverrideId: {
        value: '${cloudflare_zone_settings_override.test-zone-settings-dev.id}',
      },
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account_id: 'test-account',
      zone: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone cache reserve as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneCacheReserve, {
      enabled: true,
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone cache variants as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneCacheVariants, {
      avif: ['image/avif', 'image/webp'],
      bmp: ['image/bmp', 'image/webp'],
      gif: ['image/gif', 'image/webp'],
      jp2: ['image/jp2', 'image/webp'],
      jpeg: ['image/jpeg', 'image/webp'],
      jpg: ['image/jpg', 'image/webp'],
      jpg2: ['image/jpg2', 'image/webp'],
      png: ['image/png', 'image/webp'],
      tif: ['image/tif', 'image/webp'],
      tiff: ['image/tiff', 'image/webp'],
      webp: ['image/jpeg', 'image/webp'],
      zone_id: '${data.cloudflare_zone.test-zone-cache-variants-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone dnssec as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneDnssec, {
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone hold as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneHold, {
      hold: true,
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone lockdown as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneLockdown, {
      configurations: {
        target: 'ip_range',
        value: '192.0.2.0/24',
      },
      paused: true,
      urls: ['gradientedge.io/api/product*'],
      zone_id: '${data.cloudflare_zone.test-zone-lockdown-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone settings override as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneSettingsOverride, {
      settings: {
        automatic_https_rewrites: 'on',
        brotli: 'on',
        challenge_ttl: 2700,
        minify: {
          css: 'on',
          html: 'off',
          js: 'off',
        },
        mirage: 'on',
        opportunistic_encryption: 'on',
        security_header: {
          enabled: true,
        },
        security_level: 'high',
        waf: 'on',
      },
      zone_id: '${data.cloudflare_zone.test-zone-settings-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions worker domain as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerDomain, {
      account_id: 'test-account',
      hostname: 'test.gradientedge.io',
      service: 'product-service',
      zone_id: '${data.cloudflare_zone.test-worker-domain-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions worker domain as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerRoute, {
      pattern: 'gradientedge.io/*',
      zone_id: '${data.cloudflare_zone.test-worker-route-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions worker script as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerScript, {
      account_id: 'test-account',
      analytics_engine_binding: [
        {
          dataset: 'sample_dataset',
          name: 'sample_dataset_binding',
        },
      ],
      content:
        'exports.handler = async function (event, context, callback) {\n  console.debug(`Event: ${JSON.stringify(event)}`)\n  console.debug(`Context: ${JSON.stringify(context)}`)\n  return callback(null, { statusCode: 200 })\n}\n',
      kv_namespace_binding: [
        {
          name: 'sample_kv_namespace_binding',
          namespace_id: 'sampleNamespaceId',
        },
      ],
      name: 'test-script-dev',
      plain_text_binding: [
        {
          name: 'sample_text_binding',
          text: 'example',
        },
      ],
      r2_bucket_binding: [
        {
          name: 'sample_bucket_binding',
        },
      ],
      secret_text_binding: [
        {
          name: 'sample_secret_text_binding',
          text: 'example',
        },
      ],
      service_binding: [
        {
          environment: 'development',
          name: 'sample_service_binding',
          service: 'sample_service',
        },
      ],
      webassembly_binding: [
        {
          module: 'AGFzbQEAAAABBQFgAAF/AgwBAmpzA3RibAFwAAIDAwIAAAkIAQBBAAsCAAEKDAIEAEEqCwUAQdMACw==',
          name: 'sample_wasm_binding',
        },
      ],
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions workers kv namespace as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkersKvNamespace, {
      account_id: 'test-account',
      title: 'test-namespace-dev',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions workers kv as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkersKv, {
      account_id: 'test-account',
      key: 'test',
      namespace_id: '${cloudflare_workers_kv_namespace.test-workers-kv-ns-dev.id}',
      value: 'test123',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions worker cron trigger as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerCronTrigger, {
      account_id: 'test-account',
      schedules: ['*/5 * * * *', '10 7 * * mon-fri'],
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
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

describe('TestCloudflareCommonConstruct', () => {
  test('provisions api shield schema as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiShieldSchema, {
      kind: 'openapi_v3',
      name: 'test-api-dev',
      source: '{\n  "test": true,\n  "hello": "world"\n}\n',
      zone_id: '${data.cloudflare_zone.test-api-shield-sch-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions api shield schema validation settings as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiShieldSchemaValidationSettings, {
      validation_default_mitigation_action: 'log',
      validation_override_mitigation_action: 'none',
      zone_id: '${data.cloudflare_zone.test-api-shield-val-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions api shield operation as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiShieldOperation, {
      endpoint: '/product',
      host: 'api.gradientedge.io',
      method: 'GET',
      zone_id: '${data.cloudflare_zone.test-api-shield-op-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions api shield operation schema validation settings as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiShieldOperationSchemaValidationSettings, {
      mitigation_action: 'block',
      operation_id: '${cloudflare_api_shield_operation.test-api-shield-op-dev.id}',
      zone_id: '${data.cloudflare_zone.test-api-shield-op-val-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions filter as expected', () => {
    expect(construct).toHaveResourceWithProperties(Filter, {
      description: 'Site break-in attempts that are outside of the office',
      expression:
        '(http.request.uri.path ~ ".*wp-login.php" or http.request.uri.path ~ ".*xmlrpc.php") and ip.src ne 192.0.2.1',
      paused: false,
      zone_id: '${data.cloudflare_zone.test-filter-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions firewall rule as expected', () => {
    expect(construct).toHaveResourceWithProperties(FirewallRule, {
      filter_id: '${cloudflare_filter.test-filter-dev.id}',
      zone_id: '${data.cloudflare_zone.test-firewall-rule-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access application as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessApplication, {
      cors_headers: [
        {
          allow_all_headers: true,
          allow_credentials: true,
          allowed_origins: ['https://example.gradientedge.io'],
          max_age: 10,
        },
      ],
      domain: 'myapp-gradientedge.io',
      name: 'test-app-dev',
      session_duration: '24h',
      type: 'self_hosted',
      zone_id: '${data.cloudflare_zone.test-access-app-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access ca certificate as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessCaCertificate, {
      application_id: '${cloudflare_access_application.test-access-app-dev.id}',
      zone_id: '${data.cloudflare_zone.test-access-ca-cert-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access custom page as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessCustomPage, {
      custom_html:
        "<!doctype html>\n<html>\n  <head>\n    <title>403 Forbidden</title>\n  </head>\n  <body>\n    <h1>403 Forbidden</h1>\n    <p>Sorry, you don't have access to this resource.</p>\n  </body>\n</html>\n",
      name: '403-dev',
      type: 'forbidden',
      zone_id: '${data.cloudflare_zone.test-access-custom-page-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access group as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessGroup, {
      include: [
        {
          email: ['test@gradientedge.io'],
        },
      ],
      name: 'test-group-dev',
      zone_id: '${data.cloudflare_zone.test-access-grp-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access identity provider as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessIdentityProvider, {
      name: 'test-idp-otp-dev',
      type: 'onetimepin',
      zone_id: '${data.cloudflare_zone.test-access-idp-otp-dev-data-zone-data-zone.id}',
    })
    expect(construct).toHaveResourceWithProperties(AccessIdentityProvider, {
      config: [
        {
          attributes: ['email', 'username'],
        },
      ],
      name: 'test-idp-saml-dev',
      type: 'saml',
      zone_id: '${data.cloudflare_zone.test-access-idp-saml-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access mTls certificate as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessMutualTlsCertificate, {
      associated_hostnames: ['test.gradientedge.io'],
      certificate:
        '-----BEGIN CERTIFICATE-----\nMIIDtzCCAp+gAwIBAgIUMPxgg0ZUXMgZuijIGEZnl4Yf9YswDQYJKoZIhvcNAQEL\nBQAwazELMAkGA1UEBhMCR0IxEzARBgNVBAgMClNvbWUtU3RhdGUxDzANBgNVBAcM\nBkxvbmRvbjEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMRMwEQYD\nVQQDDApleGFtcGxlLmlvMB4XDTIzMTEyMjEwMjEwMVoXDTI0MTEyMTEwMjEwMVow\nazELMAkGA1UEBhMCR0IxEzARBgNVBAgMClNvbWUtU3RhdGUxDzANBgNVBAcMBkxv\nbmRvbjEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMRMwEQYDVQQD\nDApleGFtcGxlLmlvMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkZXE\njgNIkA7eqXFmR5NNd87K0UpUxDlVm9lRdKFNPAcuaMK/APEx4nIIEIMSUa2d9V9E\nxNXzSPz96S1li+kzVT9wkh7UYVo1jhod1UmIFw6JTovH2iGldzTo7XXcS2UT2pml\nHZLBr8VsDlseuzqA6EaErDsRZk6aZ2BGVmdhAanDnjzY5nO+XTpmcBS1u5TTNKQ6\nikhAhF7hNvHRbsZRbwXaMdUkEUPS+2lkCoSwo8UJJLpJlbD5RvnIRmyKClpLWBNZ\nwr0W4lyL0RGqUX8TqmZN/LmKW5GFOlLQID+4Xx8FDQEby8eEhAmg8I3SX1Ui4bY3\nR5Oa2+uxOcL1wj0hIQIDAQABo1MwUTAdBgNVHQ4EFgQUF2ZOdkKBfHsVWvgldNTU\n9oKAMtUwHwYDVR0jBBgwFoAUF2ZOdkKBfHsVWvgldNTU9oKAMtUwDwYDVR0TAQH/\nBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAVM1NGKM2rUFQ7IOOAcjLNoNNxz39\ntdbv0pHA+domm0FDXwDt3/fJL1qyUSMRJflnmqcIyT9+7a43nj42ip7NqbUh0B7X\nKxWR9vqajL49Eb6+nO0V8dVi9DJzqLxF2aQNMQ8KBtI2NZdaNGVJIqajgXr4fJ/G\nTlko8IAooQk+E2Ov4U/vwE1ISqVeuBsI0bTHMap9+1q+rWy8blmv5m8LZi8f/q7F\nZGXKnWWCm9TqsTf38xesu7osXtUM8+10FY4EWlh1mWBy2SeVgdgAkJACM4LGamFA\nymD5YcAsI4/RIGzp/JMjJpvhFdBbvZkxH3XIcNZ7rfeCEN5mVKJW/B1OEg==\n-----END CERTIFICATE-----\n-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCRlcSOA0iQDt6p\ncWZHk013zsrRSlTEOVWb2VF0oU08By5owr8A8THicggQgxJRrZ31X0TE1fNI/P3p\nLWWL6TNVP3CSHtRhWjWOGh3VSYgXDolOi8faIaV3NOjtddxLZRPamaUdksGvxWwO\nWx67OoDoRoSsOxFmTppnYEZWZ2EBqcOePNjmc75dOmZwFLW7lNM0pDqKSECEXuE2\n8dFuxlFvBdox1SQRQ9L7aWQKhLCjxQkkukmVsPlG+chGbIoKWktYE1nCvRbiXIvR\nEapRfxOqZk38uYpbkYU6UtAgP7hfHwUNARvLx4SECaDwjdJfVSLhtjdHk5rb67E5\nwvXCPSEhAgMBAAECggEACW3GO55Z0j6sTBQUmDkhkMtbVl+2irjd4wiZnnCd9G/Q\noSdPwItefDh/bjZW9uREMTKY3RiwN39vIG14wK17Th+cNlJ51c5GXqwxV3F6N2gR\nG32xFV8NfOF33n0+JcHnncZKq9Yn5i7mly1umZip5aE/kXoH3/TiSiSxmYH7heR0\nQZkkS+jsFPhjD6nhz0xDDJiY/1cCQ0sUvRne4G1kqN8J0Z7FMrg7cb5wZVDMRc1S\n1px6xGjSOMnMgPYRvCxEPw7Pge3J+XYg4EIiDkeU5XmtXPsNsZR5iVgoAnfgrU/N\n1oiFNYZtohl8M4NHcZy6I1C23iWAL+plJ6zOyiNmEwKBgQDNTZA+sfAg4iTLXyFg\ncgyFv5tEb2qgd1cWomFNbFyQ8ckc+EKhR7xwv1P1VXXCnqcWjqizmb0uOJpczvU6\nVPXv7kFg0CK5cnngkSFi7VimACbqvXDk8n5XI9x9xiDDEUwOZsPzs+1KGj41Cd0K\nHkRtnOjEOQF3YmLm3v1l+iPY5wKBgQC1iRLHjsKFwQUEhWOMOMqJLQrLlnpAtRpd\nrHEncMzm3NolQX+F7JM5tKCBsMtnVZG16jeACW1RENgmRYWvK4P/DdbDb28JIlD2\nMigMveNZbS0IMdbDlte0PEwUvAQrmtCxVDimDgsSi2HLcAZ1wIb3q9Oe2lE4pleZ\nxJf/PnPMtwKBgQCwg56geOanryfJf2o3/PbNS/dYOJ8phlHnUQdtxNw1dtzePokz\nF3VqTuYFyktsYHHykAd2G5mvEtWNNBdd5sxpVKT7cxhX75fgP4fAAac1Wm4bZ3OY\nNPHxRBEARofGj6mfvDV/49QB4VxYx7k3SNy2jbEHfKfJGFtGerTNp+qIQwKBgQCg\nCPIsSLdF0M6KmMkUgbBTVAjzR3oI918B+5ZZbcDFOSd6to4kU1XLBmiFTIVUWIQ2\n+f7peeYMFCxpONrMfTFFNT8CVYduZvk2wSq7aN83I98SHVW2YZFRS+LKWKHYiwe1\nfIjgIvsx4vxYqy6Wuh6B0tGhddcqeMI7Rau1kanmawKBgQCQE/orMbiFQ5ahEJsc\nCeX4ZId/12bWDtjjy/krQ7F7da0CRAnYsC9MqW+Zc4uvylNhPvRKKPLaF3XZPHvO\nn/ulnABB3u1RDx0Q9VFFs4DlgGxZEnC5aGiCaCBqk9RpFcqNWMBJfOWvHfnT1DtD\nZBR/sYHXYZuRdIzorWIxVZdMDw==\n-----END PRIVATE KEY-----',
      name: 'test-mtls-cert-dev',
      zone_id: '${data.cloudflare_zone.test-access-mtls-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access organisation as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessOrganization, {
      auth_domain: 'test.gradientedge.io',
      auto_redirect_to_identity: false,
      is_ui_read_only: false,
      name: 'test-org-dev',
      user_seat_expiration_inactive_time: '720h',
      zone_id: '${data.cloudflare_zone.test-access-org-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access policy as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessPolicy, {
      decision: 'allow',
      include: [
        {
          email: ['test@gradientedge.io'],
        },
      ],
      name: 'test-policy-props-dev',
      precedence: '1',
      require: [
        {
          email: ['test@gradientedge.io'],
        },
      ],
      zone_id: '${data.cloudflare_zone.test-access-policy-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access policy as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessRule, {
      mode: 'challenge',
      notes: 'Requests coming from known for exit nodes',
      zone_id: '${data.cloudflare_zone.test-access-rule-ch-dev-data-zone-data-zone.id}',
    })

    expect(construct).toHaveResourceWithProperties(AccessRule, {
      mode: 'whitelist',
      notes: 'Requests coming from Australia',
      zone_id: '${data.cloudflare_zone.test-access-rule-wl-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access service token as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessServiceToken, {
      lifecycle: {
        create_before_destroy: true,
      },
      min_days_for_renewal: 30,
      name: 'test-service-token-dev',
      zone_id: '${data.cloudflare_zone.test-access-ser-token-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions access tag as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessTag, {
      name: 'test-tag-dev',
      zone_id: '${data.cloudflare_zone.test-access-tag-dev-data-zone-data-zone.id}',
    })
  })
})
