import { BucketDeploymentProps, S3BucketProps } from '../../services/index.js'
import { CommonStackProps } from '../../common/index.js'

/**
 * Represents a key-value pair for exporting static asset S3 URLs as CloudFormation outputs
 */
/** @category Interface */
export interface AssetExport {
  /** The CloudFormation output logical name */
  key: string
  /** The S3 object key to generate a URL for */
  value: string
}

/**
 * The CloudFront distribution to associate with the bucket.
 * When value is configured, the construct will invalidate the distribution after the deployment.
 * Use either domainName or distributionId or domainNameRef or distributionIdRef.
 */
/** @category Interface */
export interface StaticCloudFrontDistribution {
  /**
   * @summary The domain name to associate with the bucket.
   */
  domainName?: string
  /**
   * @summary The distribution ID to associate with the bucket.
   */
  distributionId?: string
  /**
   * @summary The reference to domain name to associate with the bucket.
   */
  domainNameRef?: string
  /**
   * @summary The reference to distribution ID to associate with the bucket.
   */
  distributionIdRef?: string
  /**
   * @summary The paths to invalidate after deployment. Default is ['/*']
   */
  invalidationPaths: string[]
}

/**
 * Properties for configuring a {@link StaticAssetDeployment} construct
 */
/** @category Interface */
export interface StaticAssetDeploymentProps extends CommonStackProps {
  /** Configuration for the S3 bucket hosting the static assets */
  staticAssetBucket: S3BucketProps
  /** Configuration for the S3 bucket deployment */
  staticAssetDeployment: BucketDeploymentProps
  /** The source assets to deploy (file paths or ISource objects) */
  staticAssetSources: any[] | string[]
  /** Optional asset exports to create as CloudFormation outputs */
  staticAssetsForExport?: AssetExport[]
  /** Optional key prefix for deployed objects in the destination bucket */
  destinationKeyPrefix?: string
  /** Optional CloudFront distribution for cache invalidation after deployment */
  cloudFrontDistribution?: StaticCloudFrontDistribution
}
