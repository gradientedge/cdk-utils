import { IBucket, Bucket } from 'aws-cdk-lib/aws-s3'
import { IDistribution, Distribution } from 'aws-cdk-lib/aws-cloudfront'
import { BucketDeployment, Source, BucketDeploymentProps, ISource } from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import _ from 'lodash'
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
  cloudfrontDistribution?: IDistribution

  constructor(parent: Construct, id: string, props: StaticAssetDeploymentProps) {
    // default to create bucket to keep backward complatibility
    super(parent, id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    if (this.props.createBucket) {
      this.createAssetBucket()
    } else {
      this.loadAssetBucket()
    }
    this.deployStaticAssets()
  }

  /**
   * @summary Create the static asset bucket
   */
  protected createAssetBucket() {
    this.staticAssetBucket = this.s3Manager.createS3Bucket(`${this.id}-sa-bucket`, this, this.props.staticAssetBucket)
  }

  /**
   * @summary Loads the static asset bucket
   */
  protected loadAssetBucket() {
    this.staticAssetBucket = Bucket.fromBucketName(
      this,
      `${this.id}-sa-bucket`,
      this.props.staticAssetBucket.bucketName
    )
  }

  /**
   * @summary Distribute the load for the static asset bucket if both distribution and paths are provided
   */
  protected loadDistribution() {
    if (
      this.props.cloudFrontDistribution &&
      this.props.cloudFrontDistribution.invalidationPaths &&
      this.props.cloudFrontDistribution.invalidationPaths.length > 0
    ) {
      this.cloudfrontDistribution = Distribution.fromDistributionAttributes(
        this,
        `${this.id}-sa-distribution`,
        this.props.cloudFrontDistribution
      )
    }
  }

  /**
   * @summary Deploy the static assets into the static asset bucket
   */
  protected deployStaticAssets() {
    let sources: Array<ISource> = []
    if (
      Array.isArray(this.props.staticAssetSources) &&
      this.props.staticAssetSources.length > 0 &&
      typeof this.props.staticAssetSources[0] === 'string'
    ) {
      sources = this.props.staticAssetSources.map(source => Source.asset(source))
    } else {
      sources = this.props.staticAssetSources as ISource[]
    }

    let distributionOptions: Pick<BucketDeploymentProps, 'distribution' | 'distributionPaths'> = {}
    if (this.cloudfrontDistribution) {
      distributionOptions = {
        distribution: this.cloudfrontDistribution,
        distributionPaths: this.props.cloudFrontDistribution?.invalidationPaths,
      }
    }

    let pruneOptions: Pick<BucketDeploymentProps, 'prune'> = {}
    if (this.props.prune !== undefined) {
      pruneOptions = {
        prune: this.props.prune,
      }
    }
    new BucketDeployment(this, `${this.id}-static-deployment`, {
      ...this.props.staticAssetDeployment,
      destinationBucket: this.staticAssetBucket,
      sources: sources,
      ...distributionOptions,
      ...pruneOptions,
    })

    const staticAssetsForExport = this.props.staticAssetsForExport
    if (!staticAssetsForExport) return

    /* optional additional exports needed for asset urls */
    _.forEach(staticAssetsForExport, asset => {
      this.addCfnOutput(asset.key, this.staticAssetBucket.s3UrlForObject(asset.value))
    })
  }
}
