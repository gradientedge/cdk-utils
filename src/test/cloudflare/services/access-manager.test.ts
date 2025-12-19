import {
  AccessRule,
  ZeroTrustAccessApplication,
  ZeroTrustAccessCustomPage,
  ZeroTrustAccessGroup,
  ZeroTrustAccessIdentityProvider,
  ZeroTrustAccessMtlsCertificate,
  ZeroTrustAccessPolicy,
  ZeroTrustAccessServiceToken,
  ZeroTrustAccessShortLivedCertificate,
  ZeroTrustAccessTag,
  ZeroTrustOrganization,
  Zone,
} from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import fs from 'fs'
import {
  AccessRuleProps,
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZeroTrustAccessApplicationProps,
  ZeroTrustAccessCustomPageProps,
  ZeroTrustAccessGroupProps,
  ZeroTrustAccessIdentityProviderProps,
  ZeroTrustAccessMtlsCertificateProps,
  ZeroTrustAccessPolicyProps,
  ZeroTrustAccessServiceTokenProps,
  ZeroTrustAccessTagProps,
  ZeroTrustOrganizationProps,
  ZoneProps,
} from '../../../lib/cloudflare/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testAccessApplication: ZeroTrustAccessApplicationProps
  testAccessCustomPage: ZeroTrustAccessCustomPageProps
  testAccessGroup: ZeroTrustAccessGroupProps
  testAccessOTPIdentityProvider: ZeroTrustAccessIdentityProviderProps
  testAccessSamlIdentityProvider: ZeroTrustAccessIdentityProviderProps
  testAccessMTlsCertificate: ZeroTrustAccessMtlsCertificateProps
  testAccessOrganisation: ZeroTrustOrganizationProps
  testAccessPolicy: ZeroTrustAccessPolicyProps
  testAccessRuleChallenge: AccessRuleProps
  testAccessRuleWhitelist: AccessRuleProps
  testAccessServiceToken: ZeroTrustAccessServiceTokenProps
  testAccessTag: ZeroTrustAccessTagProps
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
  name: 'test-common-stack',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/aws/common/cdkEnv',
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
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }

  protected determineConstructProps(props: CommonCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      testAccessApplication: undefined,
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  accessApp: ZeroTrustAccessApplication
  accessCertificate: ZeroTrustAccessShortLivedCertificate
  accessCustomPage: ZeroTrustAccessCustomPage
  accessGroup: ZeroTrustAccessGroup
  accessIdentityProviderOTP: ZeroTrustAccessIdentityProvider
  accessIdentityProviderSAML: ZeroTrustAccessIdentityProvider
  accessMTLS: ZeroTrustAccessMtlsCertificate
  accessOrganisation: ZeroTrustOrganization
  accessPolicy: ZeroTrustAccessPolicy
  accessRuleChallenge: AccessRule
  accessRuleWhitelist: AccessRule
  accessServiceToken: ZeroTrustAccessServiceToken
  accessTag: ZeroTrustAccessTag

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.accessApp = this.accessManager.createAccessApplication(
      `test-access-app-${this.props.stage}`,
      this,
      this.props.testAccessApplication
    )
    this.accessCertificate = this.accessManager.createAccessShortLivedCertificate(
      `test-access-ca-cert-${this.props.stage}`,
      this,
      {
        appId: this.accessApp.id,
      }
    )
    this.accessCustomPage = this.accessManager.createAccessCustomPage(
      `test-access-custom-page-${this.props.stage}`,
      this,
      {
        ...this.props.testAccessCustomPage,
        customHtml: fs.readFileSync('src/test/cloudflare/common/sample.html', { encoding: 'utf8' }),
      }
    )
    this.accessGroup = this.accessManager.createAccessGroup(
      `test-access-grp-${this.props.stage}`,
      this,
      this.props.testAccessGroup
    )
    this.accessIdentityProviderOTP = this.accessManager.createAccessIdentityProvider(
      `test-access-idp-otp-${this.props.stage}`,
      this,
      this.props.testAccessOTPIdentityProvider
    )
    this.accessIdentityProviderSAML = this.accessManager.createAccessIdentityProvider(
      `test-access-idp-saml-${this.props.stage}`,
      this,
      this.props.testAccessSamlIdentityProvider
    )
    this.accessMTLS = this.accessManager.createAccessMutualTlsCertificate(
      `test-access-mtls-${this.props.stage}`,
      this,
      {
        ...this.props.testAccessMTlsCertificate,
        certificate: fs.readFileSync('src/test/cloudflare/common/sample.pem', { encoding: 'utf8' }),
      }
    )
    this.accessOrganisation = this.accessManager.createAccessOrganization(
      `test-access-org-${this.props.stage}`,
      this,
      this.props.testAccessOrganisation
    )
    this.accessPolicy = this.accessManager.createAccessPolicy(
      `test-access-policy-${this.props.stage}`,
      this,
      this.props.testAccessPolicy
    )
    this.accessRuleChallenge = this.accessManager.createAccessRule(
      `test-access-rule-ch-${this.props.stage}`,
      this,
      this.props.testAccessRuleChallenge
    )
    this.accessRuleWhitelist = this.accessManager.createAccessRule(
      `test-access-rule-wl-${this.props.stage}`,
      this,
      this.props.testAccessRuleWhitelist
    )
    this.accessServiceToken = this.accessManager.createAccessServiceToken(
      `test-access-ser-token-${this.props.stage}`,
      this,
      this.props.testAccessServiceToken
    )
    this.accessTag = this.accessManager.createAccessTag(
      `test-access-tag-${this.props.stage}`,
      this,
      this.props.testAccessTag
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

describe('TestCloudflareAccessManager', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflareAccessManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
    pulumi.all([stack.urn]).apply(([urn]) => {
      expect(urn).toEqual('urn:pulumi:stack::project::custom:cloudflare:Stack:test-stack::test-stack')
    })
  })
})

describe('TestCloudflareAccessManager', () => {
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

describe('TestCloudflareAccessManager', () => {
  test('provisions access application as expected', () => {
    expect(stack.construct.accessApp).toBeDefined()
    pulumi
      .all([
        stack.construct.accessApp.id,
        stack.construct.accessApp.urn,
        stack.construct.accessApp.name,
        stack.construct.accessApp.domain,
        stack.construct.accessApp.sessionDuration,
        stack.construct.accessApp.type,
        stack.construct.accessApp.zoneId,
        stack.construct.accessApp.corsHeaders,
      ])
      .apply(([id, urn, name, domain, sessionDuration, type, zoneId, corsHeaders]) => {
        expect(id).toEqual('test-access-app-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessApplication:ZeroTrustAccessApplication::test-access-app-dev'
        )
        expect(name).toEqual('test-app-dev')
        expect(domain).toEqual('myapp-gradientedge.io')
        expect(sessionDuration).toEqual('24h')
        expect(type).toEqual('self_hosted')
        expect(zoneId).toEqual('test-access-app-dev-data-zone')
        expect(corsHeaders).toEqual({
          allowAllHeaders: true,
          allowCredentials: true,
          allowedOrigins: ['https://example.gradientedge.io'],
          maxAge: 10,
        })
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions ca certificate as expected', () => {
    expect(stack.construct.accessApp).toBeDefined()
    pulumi
      .all([
        stack.construct.accessCertificate.id,
        stack.construct.accessCertificate.urn,
        stack.construct.accessCertificate.accountId,
        stack.construct.accessCertificate.appId,
        stack.construct.accessCertificate.zoneId,
      ])
      .apply(([id, urn, accountId, appId, zoneId]) => {
        expect(id).toEqual('test-access-ca-cert-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessShortLivedCertificate:ZeroTrustAccessShortLivedCertificate::test-access-ca-cert-dev'
        )
        expect(appId).toEqual('test-access-app-dev-id')
        expect(zoneId).toEqual('test-access-ca-cert-dev-data-zone')
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access custom page as expected', () => {
    expect(stack.construct.accessCustomPage).toBeDefined()
    pulumi
      .all([
        stack.construct.accessCustomPage.id,
        stack.construct.accessCustomPage.urn,
        stack.construct.accessCustomPage.name,
        stack.construct.accessCustomPage.type,
        stack.construct.accessCustomPage.customHtml,
      ])
      .apply(([id, urn, name, type, customHtml]) => {
        expect(id).toEqual('test-access-custom-page-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessCustomPage:ZeroTrustAccessCustomPage::test-access-custom-page-dev'
        )
        expect(name).toEqual('403-dev')
        expect(type).toEqual('forbidden')
        expect(customHtml).toEqual(
          "<!doctype html>\n<html>\n  <head>\n    <title>403 Forbidden</title>\n  </head>\n  <body>\n    <h1>403 Forbidden</h1>\n    <p>Sorry, you don't have access to this resource.</p>\n  </body>\n</html>\n"
        )
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access group as expected', () => {
    expect(stack.construct.accessGroup).toBeDefined()
    pulumi
      .all([
        stack.construct.accessGroup.id,
        stack.construct.accessGroup.urn,
        stack.construct.accessGroup.name,
        stack.construct.accessGroup.zoneId,
        stack.construct.accessGroup.includes,
      ])
      .apply(([id, urn, name, zoneId, includes]) => {
        expect(id).toEqual('test-access-grp-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessGroup:ZeroTrustAccessGroup::test-access-grp-dev'
        )
        expect(includes).toEqual([
          {
            email: {
              email: 'test@gradientedge.io',
            },
          },
        ])
        expect(name).toEqual('test-group - DEV')
        expect(zoneId).toEqual('test-access-grp-dev-data-zone')
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access identity provider OTP as expected', () => {
    expect(stack.construct.accessIdentityProviderOTP).toBeDefined()
    pulumi
      .all([
        stack.construct.accessIdentityProviderOTP.id,
        stack.construct.accessIdentityProviderOTP.urn,
        stack.construct.accessIdentityProviderOTP.name,
        stack.construct.accessIdentityProviderOTP.type,
        stack.construct.accessIdentityProviderOTP.zoneId,
      ])
      .apply(([id, urn, name, type, zoneId]) => {
        expect(id).toEqual('test-access-idp-otp-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessIdentityProvider:ZeroTrustAccessIdentityProvider::test-access-idp-otp-dev'
        )
        expect(name).toEqual('test-idp-otp-dev')
        expect(type).toEqual('onetimepin')
        expect(zoneId).toEqual('test-access-idp-otp-dev-data-zone')
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access identity provider SAML as expected', () => {
    expect(stack.construct.accessIdentityProviderSAML).toBeDefined()
    pulumi
      .all([
        stack.construct.accessIdentityProviderSAML.id,
        stack.construct.accessIdentityProviderSAML.urn,
        stack.construct.accessIdentityProviderSAML.name,
        stack.construct.accessIdentityProviderSAML.type,
        stack.construct.accessIdentityProviderSAML.zoneId,
      ])
      .apply(([id, urn, name, type, zoneId]) => {
        expect(id).toEqual('test-access-idp-saml-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessIdentityProvider:ZeroTrustAccessIdentityProvider::test-access-idp-saml-dev'
        )
        expect(name).toEqual('test-idp-saml-dev')
        expect(type).toEqual('saml')
        expect(zoneId).toEqual('test-access-idp-saml-dev-data-zone')
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access mTLS certificate as expected', () => {
    expect(stack.construct.accessMTLS).toBeDefined()
    pulumi
      .all([
        stack.construct.accessMTLS.id,
        stack.construct.accessMTLS.urn,
        stack.construct.accessMTLS.name,
        stack.construct.accessMTLS.zoneId,
        stack.construct.accessMTLS.associatedHostnames,
        stack.construct.accessMTLS.certificate,
      ])
      .apply(([id, urn, name, zoneId, associatedHostnames, certificate]) => {
        expect(id).toEqual('test-access-mtls-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessMtlsCertificate:ZeroTrustAccessMtlsCertificate::test-access-mtls-dev'
        )
        expect(name).toEqual('test-mtls-cert-dev')
        expect(zoneId).toEqual('test-access-mtls-dev-data-zone')
        expect(associatedHostnames).toEqual(['test.gradientedge.io'])
        expect(certificate).toEqual(
          '-----BEGIN CERTIFICATE-----\nMIIDtzCCAp+gAwIBAgIUMPxgg0ZUXMgZuijIGEZnl4Yf9YswDQYJKoZIhvcNAQEL\nBQAwazELMAkGA1UEBhMCR0IxEzARBgNVBAgMClNvbWUtU3RhdGUxDzANBgNVBAcM\nBkxvbmRvbjEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMRMwEQYD\nVQQDDApleGFtcGxlLmlvMB4XDTIzMTEyMjEwMjEwMVoXDTI0MTEyMTEwMjEwMVow\nazELMAkGA1UEBhMCR0IxEzARBgNVBAgMClNvbWUtU3RhdGUxDzANBgNVBAcMBkxv\nbmRvbjEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMRMwEQYDVQQD\nDApleGFtcGxlLmlvMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkZXE\njgNIkA7eqXFmR5NNd87K0UpUxDlVm9lRdKFNPAcuaMK/APEx4nIIEIMSUa2d9V9E\nxNXzSPz96S1li+kzVT9wkh7UYVo1jhod1UmIFw6JTovH2iGldzTo7XXcS2UT2pml\nHZLBr8VsDlseuzqA6EaErDsRZk6aZ2BGVmdhAanDnjzY5nO+XTpmcBS1u5TTNKQ6\nikhAhF7hNvHRbsZRbwXaMdUkEUPS+2lkCoSwo8UJJLpJlbD5RvnIRmyKClpLWBNZ\nwr0W4lyL0RGqUX8TqmZN/LmKW5GFOlLQID+4Xx8FDQEby8eEhAmg8I3SX1Ui4bY3\nR5Oa2+uxOcL1wj0hIQIDAQABo1MwUTAdBgNVHQ4EFgQUF2ZOdkKBfHsVWvgldNTU\n9oKAMtUwHwYDVR0jBBgwFoAUF2ZOdkKBfHsVWvgldNTU9oKAMtUwDwYDVR0TAQH/\nBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAVM1NGKM2rUFQ7IOOAcjLNoNNxz39\ntdbv0pHA+domm0FDXwDt3/fJL1qyUSMRJflnmqcIyT9+7a43nj42ip7NqbUh0B7X\nKxWR9vqajL49Eb6+nO0V8dVi9DJzqLxF2aQNMQ8KBtI2NZdaNGVJIqajgXr4fJ/G\nTlko8IAooQk+E2Ov4U/vwE1ISqVeuBsI0bTHMap9+1q+rWy8blmv5m8LZi8f/q7F\nZGXKnWWCm9TqsTf38xesu7osXtUM8+10FY4EWlh1mWBy2SeVgdgAkJACM4LGamFA\nymD5YcAsI4/RIGzp/JMjJpvhFdBbvZkxH3XIcNZ7rfeCEN5mVKJW/B1OEg==\n-----END CERTIFICATE-----\n-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCRlcSOA0iQDt6p\ncWZHk013zsrRSlTEOVWb2VF0oU08By5owr8A8THicggQgxJRrZ31X0TE1fNI/P3p\nLWWL6TNVP3CSHtRhWjWOGh3VSYgXDolOi8faIaV3NOjtddxLZRPamaUdksGvxWwO\nWx67OoDoRoSsOxFmTppnYEZWZ2EBqcOePNjmc75dOmZwFLW7lNM0pDqKSECEXuE2\n8dFuxlFvBdox1SQRQ9L7aWQKhLCjxQkkukmVsPlG+chGbIoKWktYE1nCvRbiXIvR\nEapRfxOqZk38uYpbkYU6UtAgP7hfHwUNARvLx4SECaDwjdJfVSLhtjdHk5rb67E5\nwvXCPSEhAgMBAAECggEACW3GO55Z0j6sTBQUmDkhkMtbVl+2irjd4wiZnnCd9G/Q\noSdPwItefDh/bjZW9uREMTKY3RiwN39vIG14wK17Th+cNlJ51c5GXqwxV3F6N2gR\nG32xFV8NfOF33n0+JcHnncZKq9Yn5i7mly1umZip5aE/kXoH3/TiSiSxmYH7heR0\nQZkkS+jsFPhjD6nhz0xDDJiY/1cCQ0sUvRne4G1kqN8J0Z7FMrg7cb5wZVDMRc1S\n1px6xGjSOMnMgPYRvCxEPw7Pge3J+XYg4EIiDkeU5XmtXPsNsZR5iVgoAnfgrU/N\n1oiFNYZtohl8M4NHcZy6I1C23iWAL+plJ6zOyiNmEwKBgQDNTZA+sfAg4iTLXyFg\ncgyFv5tEb2qgd1cWomFNbFyQ8ckc+EKhR7xwv1P1VXXCnqcWjqizmb0uOJpczvU6\nVPXv7kFg0CK5cnngkSFi7VimACbqvXDk8n5XI9x9xiDDEUwOZsPzs+1KGj41Cd0K\nHkRtnOjEOQF3YmLm3v1l+iPY5wKBgQC1iRLHjsKFwQUEhWOMOMqJLQrLlnpAtRpd\nrHEncMzm3NolQX+F7JM5tKCBsMtnVZG16jeACW1RENgmRYWvK4P/DdbDb28JIlD2\nMigMveNZbS0IMdbDlte0PEwUvAQrmtCxVDimDgsSi2HLcAZ1wIb3q9Oe2lE4pleZ\nxJf/PnPMtwKBgQCwg56geOanryfJf2o3/PbNS/dYOJ8phlHnUQdtxNw1dtzePokz\nF3VqTuYFyktsYHHykAd2G5mvEtWNNBdd5sxpVKT7cxhX75fgP4fAAac1Wm4bZ3OY\nNPHxRBEARofGj6mfvDV/49QB4VxYx7k3SNy2jbEHfKfJGFtGerTNp+qIQwKBgQCg\nCPIsSLdF0M6KmMkUgbBTVAjzR3oI918B+5ZZbcDFOSd6to4kU1XLBmiFTIVUWIQ2\n+f7peeYMFCxpONrMfTFFNT8CVYduZvk2wSq7aN83I98SHVW2YZFRS+LKWKHYiwe1\nfIjgIvsx4vxYqy6Wuh6B0tGhddcqeMI7Rau1kanmawKBgQCQE/orMbiFQ5ahEJsc\nCeX4ZId/12bWDtjjy/krQ7F7da0CRAnYsC9MqW+Zc4uvylNhPvRKKPLaF3XZPHvO\nn/ulnABB3u1RDx0Q9VFFs4DlgGxZEnC5aGiCaCBqk9RpFcqNWMBJfOWvHfnT1DtD\nZBR/sYHXYZuRdIzorWIxVZdMDw==\n-----END PRIVATE KEY-----'
        )
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access organisation as expected', () => {
    expect(stack.construct.accessOrganisation).toBeDefined()
    pulumi
      .all([
        stack.construct.accessOrganisation.id,
        stack.construct.accessOrganisation.urn,
        stack.construct.accessOrganisation.name,
        stack.construct.accessOrganisation.zoneId,
        stack.construct.accessOrganisation.authDomain,
        stack.construct.accessOrganisation.autoRedirectToIdentity,
        stack.construct.accessOrganisation.isUiReadOnly,
        stack.construct.accessOrganisation.userSeatExpirationInactiveTime,
      ])
      .apply(
        ([id, urn, name, zoneId, authDomain, autoRedirectToIdentity, isUiReadOnly, userSeatExpirationInactiveTime]) => {
          expect(id).toEqual('test-access-org-dev-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::cloudflare:index/zeroTrustOrganization:ZeroTrustOrganization::test-access-org-dev'
          )
          expect(name).toEqual('test-org-dev')
          expect(zoneId).toEqual('test-access-org-dev-data-zone')
          expect(authDomain).toEqual('test.gradientedge.io')
          expect(autoRedirectToIdentity).toEqual(false)
          expect(isUiReadOnly).toEqual(false)
          expect(userSeatExpirationInactiveTime).toEqual('720h')
        }
      )
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access policies as expected', () => {
    expect(stack.construct.accessPolicy).toBeDefined()
    pulumi
      .all([
        stack.construct.accessPolicy.id,
        stack.construct.accessPolicy.urn,
        stack.construct.accessPolicy.name,
        stack.construct.accessPolicy.decision,
        stack.construct.accessPolicy.includes,
        stack.construct.accessPolicy.requires,
      ])
      .apply(([id, urn, name, decision, includes, requires]) => {
        expect(id).toEqual('test-access-policy-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessPolicy:ZeroTrustAccessPolicy::test-access-policy-dev'
        )
        expect(name).toEqual('test-policy-props-dev')
        expect(decision).toEqual('allow')
        expect(includes).toEqual([
          {
            email: {
              email: 'test@gradientedge.io',
            },
          },
        ])
        expect(requires).toEqual([
          {
            email: {
              email: 'test@gradientedge.io',
            },
          },
        ])
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access challenge rule as expected', () => {
    expect(stack.construct.accessRuleChallenge).toBeDefined()
    pulumi
      .all([
        stack.construct.accessRuleChallenge.id,
        stack.construct.accessRuleChallenge.urn,
        stack.construct.accessRuleChallenge.mode,
        stack.construct.accessRuleChallenge.zoneId,
        stack.construct.accessRuleChallenge.notes,
      ])
      .apply(([id, urn, mode, zoneId, notes]) => {
        expect(id).toEqual('test-access-rule-ch-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/accessRule:AccessRule::test-access-rule-ch-dev'
        )
        expect(mode).toEqual('challenge')
        expect(zoneId).toEqual('test-access-rule-ch-dev-data-zone')
        expect(notes).toEqual('Requests coming from known for exit nodes')
      })
  })
  test('provisions access challenge whitelist as expected', () => {
    expect(stack.construct.accessRuleWhitelist).toBeDefined()
    pulumi
      .all([
        stack.construct.accessRuleWhitelist.id,
        stack.construct.accessRuleWhitelist.urn,
        stack.construct.accessRuleWhitelist.mode,
        stack.construct.accessRuleWhitelist.zoneId,
        stack.construct.accessRuleWhitelist.notes,
      ])
      .apply(([id, urn, mode, zoneId, notes]) => {
        expect(id).toEqual('test-access-rule-wl-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/accessRule:AccessRule::test-access-rule-wl-dev'
        )
        expect(mode).toEqual('whitelist')
        expect(zoneId).toEqual('test-access-rule-wl-dev-data-zone')
        expect(notes).toEqual('Requests coming from Australia')
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access service token as expected', () => {
    expect(stack.construct.accessServiceToken).toBeDefined()
    pulumi
      .all([
        stack.construct.accessServiceToken.id,
        stack.construct.accessServiceToken.urn,
        stack.construct.accessServiceToken.name,
        stack.construct.accessServiceToken.zoneId,
        stack.construct.accessServiceToken.duration,
      ])
      .apply(([id, urn, name, zoneId, duration]) => {
        expect(id).toEqual('test-access-ser-token-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessServiceToken:ZeroTrustAccessServiceToken::test-access-ser-token-dev'
        )
        expect(name).toEqual('test-service-token-dev')
        expect(zoneId).toEqual('test-access-ser-token-dev-data-zone')
        expect(duration).toEqual('300ms')
      })
  })
})

describe('TestCloudflareAccessManager', () => {
  test('provisions access tag as expected', () => {
    expect(stack.construct.accessTag).toBeDefined()
    pulumi
      .all([stack.construct.accessTag.id, stack.construct.accessTag.urn, stack.construct.accessTag.name])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-access-tag-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zeroTrustAccessTag:ZeroTrustAccessTag::test-access-tag-dev'
        )
        expect(name).toEqual('test-tag-dev')
      })
  })
})
