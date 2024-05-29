import { BucketDeploymentProps, S3BucketProps } from '../../services'
import { CommonStackProps } from '../../common'

export interface AssetExport {
  key: string
  value: string
}

/**
 * The CloudFront distribution to associate with the bucket.
 * When value is configured, the construct will invalidate the distribution after the deployment.
 * Use either domainName or distributionId or domainNameRef or distributionIdRef.
 */
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

export interface StaticAssetDeploymentProps extends CommonStackProps {
  staticAssetBucket: S3BucketProps
  staticAssetDeployment: BucketDeploymentProps
  staticAssetSources: any[] | string[]
  staticAssetsForExport?: AssetExport[]
  destinationKeyPrefix?: string
  cloudFrontDistribution?: StaticCloudFrontDistribution
}
