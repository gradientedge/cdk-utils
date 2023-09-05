import { IBucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment } from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { StaticAssetDeploymentProps } from './types'

/**
 * @classdesc Provides a construct to create and deploy static assets into S3 bucket
 * @example
 * import { StaticAssetDeployment, StaticAssetDeploymentProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends StaticAssetDeployment {
 *   constructor(parent: Construct, id: string, props: StaticAssetDeploymentProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class StaticAssetDeployment extends CommonConstruct {
  /* construct properties */
  props: StaticAssetDeploymentProps
  id: string

  /* construct resources */
  staticAssetBucket: IBucket

  constructor(parent: Construct, id: string, props: StaticAssetDeploymentProps) {
    super(parent, id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.createAssetBucket()
    this.deployStaticAssets()
  }

  /**
   * @summary Create the static asset bucket
   */
  protected createAssetBucket() {
    this.staticAssetBucket = this.s3Manager.createS3Bucket(`${this.id}-sa-bucket`, this, this.props.staticAssetBucket)
  }

  /**
   * @summary Deploy the static assets into the static asset bucket
   */
  protected deployStaticAssets() {
    new BucketDeployment(this, `${this.id}-static-deployment`, {
      ...this.props.staticAssetDeployment,
      destinationBucket: this.staticAssetBucket,
      sources: this.props.staticAssetSources,
    })

    const staticAssetsForExport = this.props.staticAssetsForExport
    if (!staticAssetsForExport) return

    /* optional additional exports needed for asset urls */
    staticAssetsForExport.forEach(asset => {
      this.addCfnOutput(asset.key, this.staticAssetBucket.s3UrlForObject(asset.value))
    })
  }
}
