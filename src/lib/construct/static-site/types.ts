import { CommonStackProps } from '../../common'
import { AcmProps, CloudfrontFunctionProps, DistributionProps, S3BucketProps } from '../../services'
import { ISource } from 'aws-cdk-lib/aws-s3-deployment'

/**
 * @category cdk-utils.static-site
 * @subcategory Properties
 */
export interface StaticSiteProps extends CommonStackProps {
  siteCacheInvalidationDockerFilePath?: string
  siteCreateAltARecord: boolean
  siteCertificate: AcmProps
  siteBucket: S3BucketProps
  siteLogBucket: S3BucketProps
  siteDistribution?: DistributionProps
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  siteFunctionFilePath?: string
  siteSource: ISource
  siteHostedZoneDomainName?: string
  siteRecordName?: string
  siteSubDomain?: string
  siteAliases?: string[]
  useExistingHostedZone: boolean
  nodeEnv: string
  logLevel: string
  timezone: string
}
