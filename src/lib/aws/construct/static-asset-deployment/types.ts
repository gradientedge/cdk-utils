import { BucketDeploymentProps, S3BucketProps } from '../../services'
import { CommonStackProps } from '../../common'

export interface AssetExport {
  key: string
  value: string
}

export interface StaticAssetDeploymentProps extends CommonStackProps {
  staticAssetBucket: S3BucketProps
  staticAssetDeployment: BucketDeploymentProps
  staticAssetSources: any[]
  staticAssetsForExport?: AssetExport[]
}
