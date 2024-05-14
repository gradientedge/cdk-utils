import { DistributionAttributes } from 'aws-cdk-lib/aws-cloudfront'
import { BucketDeploymentProps, S3BucketProps } from '../../services'
import { CommonStackProps } from '../../common'

export interface AssetExport {
  key: string
  value: string
}

export interface StaticAssetDeploymentProps extends CommonStackProps {
  /**
   * @summary If value set to `true` construct will create bucket otherwise it is going to resolve bucket from the name
   *
   * @default true
   */
  // we don't need this as this is already in S3BucketProps
  createBucket?: boolean
  staticAssetBucket: S3BucketProps
  staticAssetDeployment: BucketDeploymentProps
  staticAssetSources: any[] | string[]
  staticAssetsForExport?: AssetExport[]
  destinationKeyPrefix?: string
  // todo we don't need this as this come from S3BucketProps
  prune?: boolean
  /**
   * @summary The CloudFront distribution to associate with the bucket. When value is configured, the construct will invalidate the distribution after the deployment.
   *
   */
  cloudFrontDistribution?: DistributionAttributes & { invalidationPaths: string[] }
}
