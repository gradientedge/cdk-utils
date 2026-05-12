import { VpcProps } from 'aws-cdk-lib/aws-ec2'
import {
  OriginRequestPolicyProps,
  ResponseHeadersStrictTransportSecurity,
  ResponseSecurityHeadersBehavior,
  ResponseHeadersPolicyProps,
  CachePolicyProps,
} from 'aws-cdk-lib/aws-cloudfront'

import { CommonStackProps } from '../../common/index.js'
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
} from '../../services/index.js'

import { SiteResponseHeaderPolicyType } from './constants.js'

/**
 * Properties for configuring a {@link SiteWithEcsBackend} construct
 */
/** @category Interface */
export interface SiteWithEcsBackendProps extends CommonStackProps {
  /** The application log level */
  logLevel: string
  /** The Node.js environment (e.g. development, production) */
  nodeEnv: string
  /** Path to the Dockerfile used to invalidate the CloudFront cache after deployment */
  siteCacheInvalidationDockerFilePath?: string
  /** Configuration for the global (edge) SSL/TLS certificate */
  siteCertificate: AcmProps
  /** Configuration for a CloudFront function to attach to the distribution */
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  /** Configuration for the ECS cluster */
  siteCluster: EcsClusterProps
  /** Configuration for the CloudFront distribution */
  siteDistribution: DistributionProps
  /** Path to the Docker image used for the ECS container */
  siteEcsContainerImagePath: string
  /** Optional EFS file system configuration for persistent storage */
  siteFileSystem?: EfsFileSystemProps
  /** Optional EFS access point configurations */
  siteFileSystemAccessPoints?: EfsAccessPointOptions[]
  /** Path to the CloudFront function code file */
  siteFunctionFilePath?: string
  /** Health check configuration for the ALB target group */
  siteHealthCheck: HealthCheck
  /** Configuration for the ECS task log group */
  siteLog: LogProps
  /** Configuration for the S3 bucket used for access logs */
  siteLogBucket: S3BucketProps
  /** Configuration for the CloudFront cache policy */
  siteCachePolicy?: SiteCachePolicyProps
  /** Configuration for the CloudFront origin request policy */
  siteOriginRequestPolicy: OriginRequestPolicyProps
  /** Configuration for the CloudFront response headers policy */
  siteOriginResponseHeadersPolicy: SiteResponseHeadersPolicyProps
  /** The Route53 record name for the site */
  siteRecordName?: string
  /** Configuration for the regional SSL/TLS certificate */
  siteRegionalCertificate: AcmProps
  /** The subdomain for the site */
  siteSubDomain: string
  /** Configuration for the ECS Fargate task and service */
  siteTask: EcsApplicationLoadBalancedFargateServiceProps
  /** VPC configuration for the ECS cluster */
  siteVpc: VpcProps
  /** The timezone for the application */
  timezone: string
  /** Whether to look up an existing hosted zone instead of creating one */
  useExistingHostedZone: boolean
  /** Whether to look up an existing VPC instead of creating one */
  useExistingVpc: boolean
}

/**
 * Extended strict transport security options with duration specified in seconds
 */
/** @category Interface */
export interface SiteResponseHeadersStrictTransportSecurity extends ResponseHeadersStrictTransportSecurity {
  /** The max-age value for the Strict-Transport-Security header in seconds */
  accessControlMaxAgeInSeconds: number
}

/**
 * Extended security headers behaviour with strict transport security support
 */
/** @category Interface */
export interface SiteSecurityHeadersBehavior extends ResponseSecurityHeadersBehavior {
  /** Strict transport security configuration */
  strictTransportSecurity: SiteResponseHeadersStrictTransportSecurity
}

/**
 * Extended response headers policy properties with security headers and policy type
 */
/** @category Interface */
export interface SiteResponseHeadersPolicyProps extends ResponseHeadersPolicyProps {
  /** Security headers behaviour configuration */
  securityHeadersBehavior: SiteSecurityHeadersBehavior
  /** The policy type (origin or static) */
  type: SiteResponseHeaderPolicyType
}

/**
 * Extended cache policy properties with TTL values specified in seconds
 */
/** @category Interface */
export interface SiteCachePolicyProps extends CachePolicyProps {
  /** The default TTL for cached objects in seconds */
  defaultTtlInSeconds: number
  /** The minimum TTL for cached objects in seconds */
  minTtlInSeconds: number
  /** The maximum TTL for cached objects in seconds */
  maxTtlInSeconds: number
}
