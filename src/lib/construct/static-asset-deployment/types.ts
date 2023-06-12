import { BucketDeploymentProps, CommonStackProps, S3BucketProps } from '../../types'

export interface AssetExport {
  key: string
  value: string
}

export interface StaticAssetDeploymentProps extends CommonStackProps {
  staticAssetDeployment: BucketDeploymentProps
  staticAssetSources: any[]
  staticAssetBucket: S3BucketProps
  staticAssetsForExport?: AssetExport[]
}
