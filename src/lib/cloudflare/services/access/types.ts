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

export interface ZeroTrustAccessApplicationProps extends ZeroTrustAccessApplicationArgs {}
export interface ZeroTrustAccessShortLivedCertificateProps extends ZeroTrustAccessShortLivedCertificateArgs {}
export interface ZeroTrustAccessCustomPageProps extends ZeroTrustAccessCustomPageArgs {}
export interface ZeroTrustAccessGroupProps extends ZeroTrustAccessGroupArgs {}
export interface ZeroTrustAccessIdentityProviderProps extends ZeroTrustAccessIdentityProviderArgs {}
export interface ZeroTrustAccessMtlsCertificateProps extends ZeroTrustAccessMtlsCertificateArgs {}
export interface ZeroTrustOrganizationProps extends ZeroTrustOrganizationArgs {}
export interface ZeroTrustAccessPolicyProps extends ZeroTrustAccessPolicyArgs {}
export interface AccessRuleProps extends AccessRuleArgs {}
export interface ZeroTrustAccessServiceTokenProps extends ZeroTrustAccessServiceTokenArgs {}
export interface ZeroTrustAccessTagProps extends ZeroTrustAccessTagArgs {}
