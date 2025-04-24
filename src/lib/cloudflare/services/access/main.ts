import { ZeroTrustAccessApplication } from '@cdktf/provider-cloudflare/lib/zero-trust-access-application'
import { ZeroTrustAccessShortLivedCertificate } from '@cdktf/provider-cloudflare/lib/zero-trust-access-short-lived-certificate'
import { ZeroTrustAccessCustomPage } from '@cdktf/provider-cloudflare/lib/zero-trust-access-custom-page'
import { ZeroTrustAccessGroup } from '@cdktf/provider-cloudflare/lib/zero-trust-access-group'
import { ZeroTrustAccessIdentityProvider } from '@cdktf/provider-cloudflare/lib/zero-trust-access-identity-provider'
import { ZeroTrustAccessMtlsCertificate } from '@cdktf/provider-cloudflare/lib/zero-trust-access-mtls-certificate'
import { ZeroTrustOrganization } from '@cdktf/provider-cloudflare/lib/zero-trust-organization'
import { ZeroTrustAccessPolicy } from '@cdktf/provider-cloudflare/lib/zero-trust-access-policy'
import { AccessRule } from '@cdktf/provider-cloudflare/lib/access-rule'
import { ZeroTrustAccessServiceToken } from '@cdktf/provider-cloudflare/lib/zero-trust-access-service-token'
import { ZeroTrustAccessTag } from '@cdktf/provider-cloudflare/lib/zero-trust-access-tag'
import { CommonCloudflareConstruct } from '../../common'
import { createCloudflareTfOutput } from '../../utils'
import {
  ZeroTrustAccessApplicationProps,
  ZeroTrustAccessShortLivedCertificateProps,
  ZeroTrustAccessCustomPageProps,
  ZeroTrustAccessGroupProps,
  ZeroTrustAccessIdentityProviderProps,
  ZeroTrustAccessMtlsCertificateProps,
  ZeroTrustOrganizationProps,
  ZeroTrustAccessPolicyProps,
  AccessRuleProps,
  ZeroTrustAccessServiceTokenProps,
  ZeroTrustAccessTagProps,
} from './types'

/**
 * @classdesc Provides operations on Cloudflare Access
 * - A new instance of this class is injected into {@link CommonCloudflareConstruct} constructor.
 * - If a custom construct extends {@link CommonCloudflareConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonCloudflareConstruct, CommonCloudflareConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonCloudflareConstruct {
 *   constructor(parent: Construct, id: string, props: CommonCloudflareStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.accessManager.createApiShield('MyAppAccess', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareAccessManager {
  /**
   * @summary Method to create a new Cloudflare Application Access
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access application properties
   * @see [CDKTF Access Application Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessApplication.typescript.md}
   */
  public createAccessApplication(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessApplicationProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessApplication = new ZeroTrustAccessApplication(scope, `${id}`, {
      ...props,
      domain: `${props.domain}-${scope.props.domainName}`,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-accessApplicationFriendlyUniqueId`, scope, accessApplication.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessApplicationId`, scope, accessApplication.id)

    return accessApplication
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Short Lived Certificate
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access short lived  certificate properties
   * @see [CDKTF Access Short Lived Certificate Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessShortLivedCertificate.typescript.md}
   */
  public createAccessShortLivedCertificate(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ZeroTrustAccessShortLivedCertificateProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessShortLivedCertificate = new ZeroTrustAccessShortLivedCertificate(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(
      `${id}-accessShortLivedCertificateFriendlyUniqueId`,
      scope,
      accessShortLivedCertificate.friendlyUniqueId
    )
    createCloudflareTfOutput(`${id}-accessShortLivedCertificateId`, scope, accessShortLivedCertificate.id)

    return accessShortLivedCertificate
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Custom Page
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access custom page properties
   * @see [CDKTF Access Custom Page Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessCustomPage.typescript.md}
   */
  public createAccessCustomPage(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessCustomPageProps) {
    if (!props) throw `Props undefined for ${id}`

    const accessCustomPage = new ZeroTrustAccessCustomPage(scope, `${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      name: `${props.name}-${scope.props.stage}`,
    })

    createCloudflareTfOutput(`${id}-accessCustomPageFriendlyUniqueId`, scope, accessCustomPage.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessCustomPageId`, scope, accessCustomPage.id)

    return accessCustomPage
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Group
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access group properties
   * @see [CDKTF Access Group Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessGroup.typescript.md}
   */
  public createAccessGroup(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessGroupProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessGroup = new ZeroTrustAccessGroup(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-accessGroupFriendlyUniqueId`, scope, accessGroup.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessGroupId`, scope, accessGroup.id)

    return accessGroup
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Identity Provider
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access identity provider properties
   * @see [CDKTF Access Identity Provider Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessIdentityProvider.typescript.md}
   */
  public createAccessIdentityProvider(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ZeroTrustAccessIdentityProviderProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessIdentityProvider = new ZeroTrustAccessIdentityProvider(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })

    createCloudflareTfOutput(
      `${id}-accessIdentityProviderFriendlyUniqueId`,
      scope,
      accessIdentityProvider.friendlyUniqueId
    )
    createCloudflareTfOutput(`${id}-accessIdentityProviderId`, scope, accessIdentityProvider.id)

    return accessIdentityProvider
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Mutual Tls Certificate
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access mutual tls certificate properties
   * @see [CDKTF Access Mutual Tls Certificate Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessMtlsCertificate.typescript.md}
   */
  public createAccessMutualTlsCertificate(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ZeroTrustAccessMtlsCertificateProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessMutualTlsCertificate = new ZeroTrustAccessMtlsCertificate(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })

    createCloudflareTfOutput(
      `${id}-accessMutualTlsCertificateFriendlyUniqueId`,
      scope,
      accessMutualTlsCertificate.friendlyUniqueId
    )
    createCloudflareTfOutput(`${id}-accessMutualTlsCertificateId`, scope, accessMutualTlsCertificate.id)

    return accessMutualTlsCertificate
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Organisation
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access organisation properties
   * @see [CDKTF Access Organisation Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessOrganization.typescript.md}
   */
  public createAccessOrganization(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustOrganizationProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessOrganization = new ZeroTrustOrganization(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-accessOrganizationFriendlyUniqueId`, scope, accessOrganization.friendlyUniqueId)

    return accessOrganization
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Policy
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access policy properties
   * @see [CDKTF Access Policy Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessPolicy.typescript.md}
   */
  public createAccessPolicy(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessPolicyProps) {
    if (!props) throw `Props undefined for ${id}`

    const accessPolicy = new ZeroTrustAccessPolicy(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      accountId: props.accountId ?? scope.props.accountId,
    })

    createCloudflareTfOutput(`${id}-accessPolicyFriendlyUniqueId`, scope, accessPolicy.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessPolicyId`, scope, accessPolicy.id)

    return accessPolicy
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Rule
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access rule properties
   * @see [CDKTF Access Rule Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessRule.typescript.md}
   */
  public createAccessRule(id: string, scope: CommonCloudflareConstruct, props: AccessRuleProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessRule = new AccessRule(scope, `${id}`, {
      ...props,
      zoneId,
      accountId: props.accountId ?? scope.props.accountId,
    })

    createCloudflareTfOutput(`${id}-accessRuleFriendlyUniqueId`, scope, accessRule.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessRuleId`, scope, accessRule.id)

    return accessRule
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Service Token
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access service token properties
   * @see [CDKTF Access Service Token Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessServiceToken.typescript.md}
   */
  public createAccessServiceToken(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ZeroTrustAccessServiceTokenProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessServiceToken = new ZeroTrustAccessServiceToken(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      accountId: props.accountId ?? scope.props.accountId,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-accessServiceTokenFriendlyUniqueId`, scope, accessServiceToken.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessServiceTokenId`, scope, accessServiceToken.id)

    return accessServiceToken
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Tag
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access tag properties
   * @see [CDKTF Access Tag Token Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zeroTrustAccessTag.typescript.md}
   */
  public createAccessTag(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessTagProps) {
    if (!props) throw `Props undefined for ${id}`

    const accessTag = new ZeroTrustAccessTag(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      accountId: props.accountId ?? scope.props.accountId,
    })

    createCloudflareTfOutput(`${id}-accessTagFriendlyUniqueId`, scope, accessTag.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessTagId`, scope, accessTag.id)

    return accessTag
  }
}
