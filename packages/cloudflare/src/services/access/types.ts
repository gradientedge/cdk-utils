import {
  AccessRuleArgs,
  ZeroTrustAccessApplicationArgs,
  ZeroTrustAccessCustomPageArgs,
  ZeroTrustAccessGroupArgs,
  ZeroTrustAccessIdentityProviderArgs,
  ZeroTrustAccessMtlsCertificateArgs,
  ZeroTrustAccessPolicyArgs,
  ZeroTrustAccessServiceTokenArgs,
  ZeroTrustAccessShortLivedCertificateArgs,
  ZeroTrustAccessTagArgs,
  ZeroTrustOrganizationArgs,
} from '@pulumi/cloudflare'

/**
 * Properties for creating a Zero Trust Access Application
 * @see [Pulumi Cloudflare ZeroTrustAccessApplication]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessapplication/}
 * @category Interface
 */
export interface ZeroTrustAccessApplicationProps extends ZeroTrustAccessApplicationArgs {}
/**
 * Properties for creating a Zero Trust Access Short Lived Certificate
 * @see [Pulumi Cloudflare ZeroTrustAccessShortLivedCertificate]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessshortlivedcertificate/}
 * @category Interface
 */
export interface ZeroTrustAccessShortLivedCertificateProps extends ZeroTrustAccessShortLivedCertificateArgs {}
/**
 * Properties for creating a Zero Trust Access Custom Page
 * @see [Pulumi Cloudflare ZeroTrustAccessCustomPage]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccesscustompage/}
 * @category Interface
 */
export interface ZeroTrustAccessCustomPageProps extends ZeroTrustAccessCustomPageArgs {}
/**
 * Properties for creating a Zero Trust Access Group
 * @see [Pulumi Cloudflare ZeroTrustAccessGroup]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessgroup/}
 * @category Interface
 */
export interface ZeroTrustAccessGroupProps extends ZeroTrustAccessGroupArgs {}
/**
 * Properties for creating a Zero Trust Access Identity Provider
 * @see [Pulumi Cloudflare ZeroTrustAccessIdentityProvider]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessidentityprovider/}
 * @category Interface
 */
export interface ZeroTrustAccessIdentityProviderProps extends ZeroTrustAccessIdentityProviderArgs {}
/**
 * Properties for creating a Zero Trust Access mTLS Certificate
 * @see [Pulumi Cloudflare ZeroTrustAccessMtlsCertificate]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessmtlscertificate/}
 * @category Interface
 */
export interface ZeroTrustAccessMtlsCertificateProps extends ZeroTrustAccessMtlsCertificateArgs {}
/**
 * Properties for creating a Zero Trust Organization
 * @see [Pulumi Cloudflare ZeroTrustOrganization]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustorganization/}
 * @category Interface
 */
export interface ZeroTrustOrganizationProps extends ZeroTrustOrganizationArgs {}
/**
 * Properties for creating a Zero Trust Access Policy
 * @see [Pulumi Cloudflare ZeroTrustAccessPolicy]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccesspolicy/}
 * @category Interface
 */
export interface ZeroTrustAccessPolicyProps extends ZeroTrustAccessPolicyArgs {}
/**
 * Properties for creating an Access Rule
 * @see [Pulumi Cloudflare AccessRule]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/accessrule/}
 * @category Interface
 */
export interface AccessRuleProps extends AccessRuleArgs {}
/**
 * Properties for creating a Zero Trust Access Service Token
 * @see [Pulumi Cloudflare ZeroTrustAccessServiceToken]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccessservicetoken/}
 * @category Interface
 */
export interface ZeroTrustAccessServiceTokenProps extends ZeroTrustAccessServiceTokenArgs {}
/**
 * Properties for creating a Zero Trust Access Tag
 * @see [Pulumi Cloudflare ZeroTrustAccessTag]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zerotrustaccesstag/}
 * @category Interface
 */
export interface ZeroTrustAccessTagProps extends ZeroTrustAccessTagArgs {}
