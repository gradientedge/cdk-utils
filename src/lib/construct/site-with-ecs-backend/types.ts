import { CommonStackProps } from '../../common'
import {
  AcmProps,
  CloudfrontFunctionProps,
  DistributionProps,
  EcsApplicationLoadBalancedFargateServiceProps,
  EcsClusterProps,
  EfsAccessPointOptions,
  EfsFileSystemProps,
  HealthCheck,
  LogProps,
  S3BucketProps,
} from '../../services'
import { VpcProps } from 'aws-cdk-lib/aws-ec2'
import {
  OriginRequestPolicyProps,
  ResponseHeadersStrictTransportSecurity,
  ResponseSecurityHeadersBehavior,
  ResponseHeadersPolicyProps,
  CachePolicyProps,
} from 'aws-cdk-lib/aws-cloudfront'
import { SiteResponseHeaderPolicyType } from './constants'

/**
 */
export interface SiteWithEcsBackendProps extends CommonStackProps {
  logLevel: string
  nodeEnv: string
  siteCacheInvalidationDockerFilePath?: string
  siteCertificate: AcmProps
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  siteCluster: EcsClusterProps
  siteDistribution: DistributionProps
  siteEcsContainerImagePath: string
  siteFileSystem?: EfsFileSystemProps
  siteFileSystemAccessPoints?: EfsAccessPointOptions[]
  siteFunctionFilePath?: string
  siteHealthCheck: HealthCheck
  siteLog: LogProps
  siteLogBucket: S3BucketProps
  siteCachePolicy: SiteCachePolicyProps
  siteOriginRequestPolicy: OriginRequestPolicyProps
  siteOriginResponseHeadersPolicy: SiteResponseHeadersPolicyProps
  siteRecordName?: string
  siteRegionalCertificate: AcmProps
  siteSubDomain: string
  siteTask: EcsApplicationLoadBalancedFargateServiceProps
  siteVpc: VpcProps
  timezone: string
  useExistingHostedZone: boolean
  useExistingVpc: boolean
}

export interface SiteResponseHeadersStrictTransportSecurity extends ResponseHeadersStrictTransportSecurity {
  accessControlMaxAgeInSeconds: number
}

export interface SiteSecurityHeadersBehavior extends ResponseSecurityHeadersBehavior {
  strictTransportSecurity: SiteResponseHeadersStrictTransportSecurity
}

export interface SiteResponseHeadersPolicyProps extends ResponseHeadersPolicyProps {
  securityHeadersBehavior: SiteSecurityHeadersBehavior
  type: SiteResponseHeaderPolicyType
}

export interface SiteCachePolicyProps extends CachePolicyProps {
  defaultTtlInSeconds: number
  minTtlInSeconds: number
  maxTtlInSeconds: number
}
