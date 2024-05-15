import { DistributionAttributes } from 'aws-cdk-lib/aws-cloudfront'
import { BucketDeploymentProps, S3BucketProps } from '../../services'
import { CommonStackProps } from '../../common'

export interface AssetExport {
  key: string
  value: string
}

export interface StaticAssetDeploymentProps extends CommonStackProps {
  staticAssetBucket: S3BucketProps
  staticAssetDeployment: BucketDeploymentProps
  staticAssetSources: any[] | string[]
  staticAssetsForExport?: AssetExport[]
  destinationKeyPrefix?: string
  /**
   * @summary The CloudFront distribution to associate with the bucket. When value is configured, the construct will invalidate the distribution after the deployment.
   *
   */
  cloudFrontDistribution?: DistributionAttributes & { invalidationPaths: string[] }
}
