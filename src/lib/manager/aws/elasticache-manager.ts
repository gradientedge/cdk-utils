import * as elasticache from 'aws-cdk-lib/aws-elasticache'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.elasticache-manager
 * @subcategory Construct
 * @summary Provides operations on AWS ElastiCache Service.
 * - A new instance of scope class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.elasticacheManager.createElastiCache('MyElastiCache', scope, props)
 *   }
 * }
 *
 * @see [CDK ElastiCache Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_elasticache-readme.html}
 */
export class ElastiCacheManager {
  /**
   * @summary Method to create an elasticache resource
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which scope resource is defined
   * @param {string[]} subnetIds
   */
  public createElastiCacheSubnetGroup(id: string, scope: common.CommonConstruct, subnetIds: string[]) {
    const elasticacheSubnetGroup = new elasticache.CfnSubnetGroup(scope, `${id}`, {
      cacheSubnetGroupName: `${id}-subnet-group-${scope.props.stage}`,
      subnetIds: subnetIds,
      description: `${id}-subnet-group-${scope.props.stage}`,
    })

    return elasticacheSubnetGroup
  }

  /**
   * @summary Method to create an elasticache resource
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which scope resource is defined
   * @param {types.ElastiCacheProps} props
   * @param {string[]} subnetIds
   * @param {string[]} securityGroupIds
   * @param {string[]} logDeliveryConfigurations
   */
  public createElastiCache(
    id: string,
    scope: common.CommonConstruct,
    props: types.ElastiCacheProps,
    subnetIds: string[],
    securityGroupIds: string[],
    logDeliveryConfigurations?: any
  ) {
    if (!props) throw `ElastiCache props undefined`

    const subnetGroup = this.createElastiCacheSubnetGroup(`${id}-subnetGroup`, scope, subnetIds)

    const elasticacheCluster = new elasticache.CfnCacheCluster(scope, `${id}`, {
      engine: props.engine,
      engineVersion: props.engineVersion,
      cacheNodeType: props.cacheNodeType,
      numCacheNodes: props.numCacheNodes,
      clusterName: `${id}-${scope.props.stage}`,
      vpcSecurityGroupIds: securityGroupIds,
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
      azMode: props.azMode,
      preferredAvailabilityZones: props.preferredAvailabilityZones,
      preferredMaintenanceWindow: props.preferredMaintenanceWindow,
      autoMinorVersionUpgrade: props.autoMinorVersionUpgrade,
      cacheParameterGroupName: props.cacheParameterGroupName,
      cacheSecurityGroupNames: props.cacheSecurityGroupNames,
      port: props.port,
      snapshotArns: props.snapshotArns,
      snapshotName: props.snapshotName,
      snapshotRetentionLimit: props.snapshotRetentionLimit,
      snapshotWindow: props.snapshotWindow,
      logDeliveryConfigurations: logDeliveryConfigurations,
    })

    utils.createCfnOutput(`${id}-clusterName`, scope, elasticacheCluster.clusterName)
    utils.createCfnOutput(`${id}-redisEndpointPort`, scope, elasticacheCluster.attrRedisEndpointPort)
    utils.createCfnOutput(`${id}-redisEndpointAddress`, scope, elasticacheCluster.attrRedisEndpointAddress)

    return elasticacheCluster
  }
}
