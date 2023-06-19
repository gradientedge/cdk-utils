import { BucketDeploymentProps, S3BucketProps } from '../../services'
import { CommonStackProps } from '../../common'

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
