import * as elasticache from 'aws-cdk-lib/aws-elasticache'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category Containers
 * @summary Provides operations on AWS Elasticache Service.
 * - A new instance of scope class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     props = props
 *     ecsManager.createEcsCluster('MyCluster', scope, vpc)
 *   }
 * }
 *
 * @see [CDK Elasticache Module]{@link https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-elasticache.CfnCacheCluster.html}
 */
export class ElasticacheManager {
  /**
   * @summary Method to create an elasticache resource
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which scope resource is defined
   * @param {string[]} subnetIds
   */
  public createElasticacheSubnetGroup(id: string, scope: common.CommonConstruct, subnetIds: string[]) {
    const elasticacheSubnetGroup = new elasticache.CfnSubnetGroup(scope, `${id}`, {
      cacheSubnetGroupName: `${id}SubnetGroup`,
      subnetIds: subnetIds,
      description: `${id} Subnet Group`,
    })

    return elasticacheSubnetGroup
  }

  /**
   * @summary Method to create an elasticache resource
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which scope resource is defined
   * @param {types.ElasticacheProps} props
   * @param {string[]} subnetIds
   * @param {string[]} securityGroupIds
   * @param {string[]} logDeliveryConfigurations
   */
  public createElasticache(
    id: string,
    scope: common.CommonConstruct,
    props: types.ElasticacheProps,
    subnetIds: string[],
    securityGroupIds: string[],
    logDeliveryConfigurations?: any
  ) {
    if (!props) throw `Elasticache props undefined`

    const subnetGroup = this.createElasticacheSubnetGroup(`${id}-subnetGroup`, scope, subnetIds)

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

    utils.createCfnOutput(`${id}-ClusterName`, scope, elasticacheCluster.clusterName)
    utils.createCfnOutput(
      `${id}-ConfigurationEndpointAddress`,
      scope,
      elasticacheCluster.attrConfigurationEndpointAddress
    )
    utils.createCfnOutput(`${id}-ConfigurationEndpointPort`, scope, elasticacheCluster.attrConfigurationEndpointPort)
    utils.createCfnOutput(`${id}-RedisEndpointPort`, scope, elasticacheCluster.attrRedisEndpointPort)
    utils.createCfnOutput(`${id}-RedisEndpointAddress`, scope, elasticacheCluster.attrRedisEndpointAddress)

    return elasticacheCluster
  }
}
