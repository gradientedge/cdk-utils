import { CommonConstruct } from '../../common'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
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
  staticAssetBucket: s3.IBucket

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
   * @summary Deploy the static assests into the static asset bucket
   */
  protected deployStaticAssets() {
    new s3deploy.BucketDeployment(this, `${this.id}-static-deployment`, {
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
