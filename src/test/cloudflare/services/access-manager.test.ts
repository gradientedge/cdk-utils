import { AccessApplication } from '@cdktf/provider-cloudflare/lib/access-application'
import { AccessCaCertificate } from '@cdktf/provider-cloudflare/lib/access-ca-certificate'
import { AccessCustomPage } from '@cdktf/provider-cloudflare/lib/access-custom-page'
import { AccessGroup } from '@cdktf/provider-cloudflare/lib/access-group'
import { AccessIdentityProvider } from '@cdktf/provider-cloudflare/lib/access-identity-provider'
import { AccessMutualTlsCertificate } from '@cdktf/provider-cloudflare/lib/access-mutual-tls-certificate'
import { AccessOrganization } from '@cdktf/provider-cloudflare/lib/access-organization'
import { AccessPolicy } from '@cdktf/provider-cloudflare/lib/access-policy'
import { AccessRule } from '@cdktf/provider-cloudflare/lib/access-rule'
import { AccessServiceToken } from '@cdktf/provider-cloudflare/lib/access-service-token'
import { AccessTag } from '@cdktf/provider-cloudflare/lib/access-tag'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
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
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZoneProps,
} from '../../../lib'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
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

describe('TestCloudflareAccessManager', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-access-app-dev')
  })
})

describe('TestCloudflareAccessManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareAccessManager', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareAccessManager', () => {
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
      testZoneDevZoneFriendlyUniqueId: { value: 'test-zone-dev' },
      testZoneDevZoneId: { value: '${cloudflare_zone.test-zone-dev.id}' },
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.zone}' },
    })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account_id: 'test-account',
      zone: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
  test('provisions access ca certificate as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessCaCertificate, {
      application_id: '${cloudflare_access_application.test-access-app-dev.id}',
      zone_id: '${data.cloudflare_zone.test-access-ca-cert-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
  test('provisions access tag as expected', () => {
    expect(construct).toHaveResourceWithProperties(AccessTag, {
      name: 'test-tag-dev',
      zone_id: '${data.cloudflare_zone.test-access-tag-dev-data-zone-data-zone.id}',
    })
  })
})
