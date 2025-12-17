import { CommonStackProps } from '../../common/index.js'
import { AcmProps, CloudfrontFunctionProps, DistributionProps, S3BucketProps } from '../../services/index.js'
import { ISource } from 'aws-cdk-lib/aws-s3-deployment'

/**
 */
export interface StaticSiteProps extends CommonStackProps {
  logLevel: string
  nodeEnv: string
  siteAliases?: string[]
  siteBucket: S3BucketProps
  siteCacheInvalidationDockerFilePath?: string
  siteCertificate: AcmProps
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  siteCreateAltARecord: boolean
  siteDistribution?: DistributionProps
  siteFunctionFilePath?: string
  siteHostedZoneDomainName?: string
  siteLogBucket: S3BucketProps
  siteRecordName?: string
  siteSource: ISource
  siteSubDomain?: string
  timezone: string
  /**
   * Whether to prune the contents of the bucket when deploying assets.
   *
   * @default true
   */
  pruneOnDeployment?: boolean
  useExistingHostedZone: boolean
}
