import { ISource } from 'aws-cdk-lib/aws-s3-deployment'

import { CommonStackProps } from '../../common/index.js'
import { AcmProps, CloudfrontFunctionProps, DistributionProps, S3BucketProps } from '../../services/index.js'

/**
 * Properties for configuring a {@link StaticSite} construct
 */
/** @category Interface */
export interface StaticSiteProps extends CommonStackProps {
  /** The application log level */
  logLevel: string
  /** The Node.js environment (e.g. development, production) */
  nodeEnv: string
  /** Additional domain aliases for the CloudFront distribution */
  siteAliases?: string[]
  /** Configuration for the S3 bucket hosting the static site */
  siteBucket: S3BucketProps
  /** Path to the Dockerfile used to invalidate the CloudFront cache after deployment */
  siteCacheInvalidationDockerFilePath?: string
  /** Configuration for the SSL/TLS certificate */
  siteCertificate: AcmProps
  /** Configuration for a CloudFront function to attach to the distribution */
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  /** Whether to create an alternative A record for the site */
  siteCreateAltARecord: boolean
  /** Configuration for the CloudFront distribution */
  siteDistribution?: DistributionProps
  /** Path to the CloudFront function code file */
  siteFunctionFilePath?: string
  /** The hosted zone domain name override */
  siteHostedZoneDomainName?: string
  /** Configuration for the S3 bucket used for access logs */
  siteLogBucket: S3BucketProps
  /** The Route53 record name for the site */
  siteRecordName?: string
  /** The source asset to deploy to the site bucket */
  siteSource: ISource
  /** The subdomain for the static site */
  siteSubDomain?: string
  /** The timezone for the application */
  timezone: string
  /**
   * Whether to prune the contents of the bucket when deploying assets.
   *
   * @default true
   */
  pruneOnDeployment?: boolean
  /** Whether to look up an existing hosted zone instead of creating one */
  useExistingHostedZone: boolean
}
