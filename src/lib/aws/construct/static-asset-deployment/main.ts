import { Fn } from 'aws-cdk-lib'
import { IBucket } from 'aws-cdk-lib/aws-s3'
import { IDistribution, DistributionAttributes } from 'aws-cdk-lib/aws-cloudfront'
import { Construct } from 'constructs'
import { BucketDeployment, Source, BucketDeploymentProps, ISource } from 'aws-cdk-lib/aws-s3-deployment'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { StaticAssetDeploymentProps } from './types'
import appRoot from 'app-root-path'
import path from 'path'

/**
 * @classdesc Provides a construct to create and deploy static assets into S3 bucket
 * @example
 * import { StaticAssetDeployment, StaticAssetDeploymentProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends StaticAssetDeployment {
 *   constructor(parent: Construct, id: string, props: StaticAssetDeploymentProps) {
 *     super(parent, id, props)
 *     this.initResources()
 *   }
 * }
 */
export class StaticAssetDeployment extends CommonConstruct {
  /* construct resources */
  staticAssetBucket: IBucket
  cloudfrontDistribution?: IDistribution
  props: StaticAssetDeploymentProps
  id: string

  constructor(parent: Construct, id: string, props: StaticAssetDeploymentProps) {
    super(parent, id, props)
    this.id = id
    this.props = props
  }
  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.createAssetBucket()
    this.resolveDistribution()
    this.deployStaticAssets()
  }

  /**
   * @summary Create the static asset bucket
   */
  protected createAssetBucket() {
    this.staticAssetBucket = this.s3Manager.createS3Bucket(`${this.id}-sa-bucket`, this, this.props.staticAssetBucket)
  }

  /**
   * @summary Distribute the load for the static asset bucket if both distribution and paths are provided
   */
  protected resolveDistribution() {
    if (
      this.props.cloudFrontDistribution &&
      (this.props.cloudFrontDistribution.domainName || this.props.cloudFrontDistribution.domainNameRef) &&
      (this.props.cloudFrontDistribution.distributionId || this.props.cloudFrontDistribution.distributionIdRef) &&
      this.props.cloudFrontDistribution.invalidationPaths &&
      this.props.cloudFrontDistribution.invalidationPaths.length > 0
    ) {
      let domainName = this.props.cloudFrontDistribution.domainName
      if (this.props.cloudFrontDistribution.domainNameRef) {
        domainName = Fn.importValue(this.props.cloudFrontDistribution.domainNameRef)
      }
      let distributionId = this.props.cloudFrontDistribution.distributionId
      if (this.props.cloudFrontDistribution.distributionIdRef) {
        distributionId = Fn.importValue(this.props.cloudFrontDistribution.distributionIdRef)
      }

      const distributionAttributes = {
        domainName: domainName,
        distributionId: distributionId,
      } as any as DistributionAttributes

      this.cloudfrontDistribution = this.cloudFrontManager.resolveDistribution(this, distributionAttributes)
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
      sources = this.props.staticAssetSources.map(source => {
        const resolvedPath = path.join(appRoot.path, source)
        return Source.asset(resolvedPath)
      })
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

    let destinationKeyPrefixOptions = {}
    if (this.props.destinationKeyPrefix) {
      destinationKeyPrefixOptions = {
        destinationKeyPrefix: this.props.destinationKeyPrefix,
      }
    }

    new BucketDeployment(this, `${this.id}-static-deployment`, {
      ...this.props.staticAssetDeployment,
      destinationBucket: this.staticAssetBucket,
      sources: sources,
      ...destinationKeyPrefixOptions,
      ...distributionOptions,
    })

    const staticAssetsForExport = this.props.staticAssetsForExport
    if (!staticAssetsForExport) return

    /* optional additional exports needed for asset urls */
    _.forEach(staticAssetsForExport, asset => {
      this.addCfnOutput(asset.key, this.staticAssetBucket.s3UrlForObject(asset.value))
    })
  }
}
