import { AccessApplication } from '@cdktf/provider-cloudflare/lib/access-application'
import { AccessCaCertificate } from '@cdktf/provider-cloudflare/lib/access-ca-certificate'
import { AccessCustomPage } from '@cdktf/provider-cloudflare/lib/access-custom-page'
import { AccessGroup } from '@cdktf/provider-cloudflare/lib/access-group'
import { AccessIdentityProvider } from '@cdktf/provider-cloudflare/lib/access-identity-provider'
import { AccessMutualTlsCertificate } from '@cdktf/provider-cloudflare/lib/access-mutual-tls-certificate'
import { CommonCloudflareConstruct } from '../../common'
import { createCloudflareTfOutput } from '../../utils'
import {
  AccessApplicationProps,
  AccessCaCertificateProps,
  AccessCustomPageProps,
  AccessGroupProps,
  AccessIdentityProviderProps,
  AccessMutualTlsCertificateProps,
  AccessOrganizationProps,
  AccessPolicyProps,
  AccessRuleProps,
  AccessServiceTokenProps,
  AccessTagProps,
} from './types'
import { AccessOrganization } from '@cdktf/provider-cloudflare/lib/access-organization'
import { AccessPolicy } from '@cdktf/provider-cloudflare/lib/access-policy'
import { AccessRule } from '@cdktf/provider-cloudflare/lib/access-rule'
import { AccessServiceToken } from '@cdktf/provider-cloudflare/lib/access-service-token'
import { AccessTag } from '@cdktf/provider-cloudflare/lib/access-tag'

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
   * @see [CDKTF Access Application Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessApplication.typescript.md}
   */
  public createAccessApplication(id: string, scope: CommonCloudflareConstruct, props: AccessApplicationProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessApplication = new AccessApplication(scope, `${id}`, {
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
   * @summary Method to create a new Cloudflare Application Access CA Certificate
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access ca certificate properties
   * @see [CDKTF Access Ca Certificate Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessCaCertificate.typescript.md}
   */
  public createAccessCaCertificate(id: string, scope: CommonCloudflareConstruct, props: AccessCaCertificateProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessCaCertificate = new AccessCaCertificate(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-accessCaCertificateFriendlyUniqueId`, scope, accessCaCertificate.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessCaCertificateId`, scope, accessCaCertificate.id)

    return accessCaCertificate
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Custom Page
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access custom page properties
   * @see [CDKTF Access Custom Page Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessCustomPage.typescript.md}
   */
  public createAccessCustomPage(id: string, scope: CommonCloudflareConstruct, props: AccessCustomPageProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessCustomPage = new AccessCustomPage(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
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
   * @see [CDKTF Access Group Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessGroup.typescript.md}
   */
  public createAccessGroup(id: string, scope: CommonCloudflareConstruct, props: AccessGroupProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessGroup = new AccessGroup(scope, `${id}`, {
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
   * @see [CDKTF Access Identity Provider Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessIdentityProvider.typescript.md}
   */
  public createAccessIdentityProvider(
    id: string,
    scope: CommonCloudflareConstruct,
    props: AccessIdentityProviderProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessIdentityProvider = new AccessIdentityProvider(scope, `${id}`, {
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
   * @see [CDKTF Access Mutual Tls Certificate Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessMutualTlsCertificate.typescript.md}
   */
  public createAccessMutualTlsCertificate(
    id: string,
    scope: CommonCloudflareConstruct,
    props: AccessMutualTlsCertificateProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessMutualTlsCertificate = new AccessMutualTlsCertificate(scope, `${id}`, {
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
   * @see [CDKTF Access Organisation Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessOrganization.typescript.md}
   */
  public createAccessOrganization(id: string, scope: CommonCloudflareConstruct, props: AccessOrganizationProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessOrganization = new AccessOrganization(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-accessOrganizationFriendlyUniqueId`, scope, accessOrganization.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessOrganizationId`, scope, accessOrganization.id)

    return accessOrganization
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Policy
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access policy properties
   * @see [CDKTF Access Policy Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessPolicy.typescript.md}
   */
  public createAccessPolicy(id: string, scope: CommonCloudflareConstruct, props: AccessPolicyProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessPolicy = new AccessPolicy(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
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
   * @see [CDKTF Access Service Token Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessServiceToken.typescript.md}
   */
  public createAccessServiceToken(id: string, scope: CommonCloudflareConstruct, props: AccessServiceTokenProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessServiceToken = new AccessServiceToken(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
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
   * @see [CDKTF Access Tag Token Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/accessTag.typescript.md}
   */
  public createAccessTag(id: string, scope: CommonCloudflareConstruct, props: AccessTagProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const accessTag = new AccessTag(scope, `${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-accessTagFriendlyUniqueId`, scope, accessTag.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-accessTagId`, scope, accessTag.id)

    return accessTag
  }
}
