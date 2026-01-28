import * as cloudflare from '@pulumi/cloudflare'
import { CommonCloudflareConstruct } from '../../common/construct.js'
import {
  AccessRuleProps,
  ZeroTrustAccessApplicationProps,
  ZeroTrustAccessCustomPageProps,
  ZeroTrustAccessGroupProps,
  ZeroTrustAccessIdentityProviderProps,
  ZeroTrustAccessMtlsCertificateProps,
  ZeroTrustAccessPolicyProps,
  ZeroTrustAccessServiceTokenProps,
  ZeroTrustAccessShortLivedCertificateProps,
  ZeroTrustAccessTagProps,
  ZeroTrustOrganizationProps,
} from './types.js'

/**
 * @classdesc Provides operations on Cloudflare Access
 * - A new instance of this class is injected into {@link CommonCloudflareComponent} constructor.
 * - If a custom component extends {@link CommonCloudflareComponent}, an instance is available within the context.
 * @example
 * ```
 * import { CommonCloudflareComponent, CloudflareAccessManager } from '@gradientedge/cdk-utils'
 *
 * class CustomComponent extends CommonCloudflareComponent {
 *   constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
 *     super(name, args, opts)
 *     this.accessManager.createAccessApplication('MyAppAccess', this, props)
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
   * @see [Pulumi Cloudflare Access Application]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessapplication/}
   */
  public createAccessApplication(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessApplicationProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, {
          filter: { name: scope.props.domainName },
        })?.id

    return new cloudflare.ZeroTrustAccessApplication(`${id}`, {
      ...props,
      domain: `${props.domain}-${scope.props.domainName}`,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Short Lived Certificate
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access short lived certificate properties
   * @see [Pulumi Cloudflare Access Short Lived Certificate]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessshortlivedcertificate/}
   */
  public createAccessShortLivedCertificate(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ZeroTrustAccessShortLivedCertificateProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, {
          filter: { name: scope.props.domainName },
        })?.id

    return new cloudflare.ZeroTrustAccessShortLivedCertificate(`${id}`, {
      ...props,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Custom Page
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access custom page properties
   * @see [Pulumi Cloudflare Access Custom Page]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccesscustompage/}
   */
  public createAccessCustomPage(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessCustomPageProps) {
    if (!props) throw `Props undefined for ${id}`

    return new cloudflare.ZeroTrustAccessCustomPage(`${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      name: `${props.name}-${scope.props.stage}`,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Group
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access group properties
   * @see [Pulumi Cloudflare Access Group]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessgroup/}
   */
  public createAccessGroup(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessGroupProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, {
          filter: { name: scope.props.domainName },
        })?.id

    return new cloudflare.ZeroTrustAccessGroup(`${id}`, {
      ...props,
      name: `${props.name} - ${scope.props.stage.toUpperCase()}`,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Identity Provider
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access identity provider properties
   * @see [Pulumi Cloudflare Access Identity Provider]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessidentityprovider/}
   */
  public createAccessIdentityProvider(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ZeroTrustAccessIdentityProviderProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, {
          filter: { name: scope.props.domainName },
        })?.id

    return new cloudflare.ZeroTrustAccessIdentityProvider(`${id}`, {
      ...props,
      config: props.config ?? {},
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Mutual Tls Certificate
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access mutual tls certificate properties
   * @see [Pulumi Cloudflare Access Mutual Tls Certificate]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessmtlscertificate/}
   */
  public createAccessMutualTlsCertificate(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ZeroTrustAccessMtlsCertificateProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, {
          filter: { name: scope.props.domainName },
        })?.id

    return new cloudflare.ZeroTrustAccessMtlsCertificate(`${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Organisation
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access organisation properties
   * @see [Pulumi Cloudflare Zero Trust Organization]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustorganization/}
   */
  public createAccessOrganization(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustOrganizationProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, {
          filter: { name: scope.props.domainName },
        })?.id

    return new cloudflare.ZeroTrustOrganization(`${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Policy
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access policy properties
   * @see [Pulumi Cloudflare Access Policy]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccesspolicy/}
   */
  public createAccessPolicy(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessPolicyProps) {
    if (!props) throw `Props undefined for ${id}`

    return new cloudflare.ZeroTrustAccessPolicy(`${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      accountId: props.accountId ?? scope.props.accountId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Rule
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access rule properties
   * @see [Pulumi Cloudflare Access Rule]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/accessrule/}
   */
  public createAccessRule(id: string, scope: CommonCloudflareConstruct, props: AccessRuleProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, {
          filter: { name: scope.props.domainName },
        })?.id

    return new cloudflare.AccessRule(`${id}`, {
      ...props,
      zoneId,
      accountId: props.accountId ?? scope.props.accountId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Service Token
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access service token properties
   * @see [Pulumi Cloudflare Access Service Token]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessservicetoken/}
   */
  public createAccessServiceToken(
    id: string,
    scope: CommonCloudflareConstruct,
    props: ZeroTrustAccessServiceTokenProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, {
          filter: { name: scope.props.domainName },
        })?.id

    return new cloudflare.ZeroTrustAccessServiceToken(`${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      accountId: props.accountId ?? scope.props.accountId,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Application Access Tag
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props access tag properties
   * @see [Pulumi Cloudflare Access Tag]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccesstag/}
   */
  public createAccessTag(id: string, scope: CommonCloudflareConstruct, props: ZeroTrustAccessTagProps) {
    if (!props) throw `Props undefined for ${id}`

    return new cloudflare.ZeroTrustAccessTag(`${id}`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      accountId: props.accountId ?? scope.props.accountId,
    })
  }
}
