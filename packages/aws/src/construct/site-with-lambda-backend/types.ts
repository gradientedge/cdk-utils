import {
  CachePolicyProps,
  OriginRequestPolicyProps,
  ResponseHeadersPolicyProps,
  ResponseHeadersStrictTransportSecurity,
  ResponseSecurityHeadersBehavior,
} from 'aws-cdk-lib/aws-cloudfront'

import { CommonStackProps } from '../../common/index.js'
import {
  AcmProps,
  CloudfrontFunctionProps,
  DistributionProps,
  LambdaProps,
  LogProps,
  S3BucketProps,
} from '../../services/index.js'

import { SiteWithLambdaBackendResponseHeaderPolicyType } from './constants.js'

/**
 */
/** @category Interface */
export interface SiteWithLambdaBackendProps extends CommonStackProps {
  logLevel: string
  nodeEnv: string
  siteCacheInvalidationDockerFilePath?: string
  siteCertificate: AcmProps
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  siteDistribution: DistributionProps
  siteExecWrapperPath: string
  siteFunctionFilePath?: string
  siteHealthEndpoint: string
  siteLambda: LambdaProps
  siteLog: LogProps
  siteLogBucket: S3BucketProps
  sitePort: string
  siteCachePolicy?: SiteWithLambdaBackendCachePolicyProps
  siteOriginRequestPolicy: OriginRequestPolicyProps
  siteOriginResponseHeadersPolicy: SiteWithLambdaBackendResponseHeadersPolicyProps
  siteRecordName?: string
  siteRegionalCertificate: AcmProps
  siteSubDomain: string
  timezone: string
  useExistingHostedZone: boolean
  useExistingVpc: boolean
}

/** @category Interface */
export interface SiteWithLambdaBackendResponseHeadersStrictTransportSecurity extends ResponseHeadersStrictTransportSecurity {
  accessControlMaxAgeInSeconds: number
}

/** @category Interface */
export interface SiteWithLambdaBackendSecurityHeadersBehavior extends ResponseSecurityHeadersBehavior {
  strictTransportSecurity: SiteWithLambdaBackendResponseHeadersStrictTransportSecurity
}

/** @category Interface */
export interface SiteWithLambdaBackendResponseHeadersPolicyProps extends ResponseHeadersPolicyProps {
  securityHeadersBehavior: SiteWithLambdaBackendSecurityHeadersBehavior
  type: SiteWithLambdaBackendResponseHeaderPolicyType
}

/** @category Interface */
export interface SiteWithLambdaBackendCachePolicyProps extends CachePolicyProps {
  defaultTtlInSeconds: number
  minTtlInSeconds: number
  maxTtlInSeconds: number
}
