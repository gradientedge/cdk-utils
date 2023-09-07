import { Tags } from 'aws-cdk-lib'
import { CfnCacheCluster, CfnReplicationGroup, CfnSubnetGroup } from 'aws-cdk-lib/aws-elasticache'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import { ElastiCacheProps, ReplicatedElastiCacheProps } from './types'

/**
 * @summary Provides operations on AWS ElastiCache Service.
 * - A new instance of scope class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.elasticacheManager.createElastiCache('MyElastiCache', scope, props)
 *   }
 * }
 * @see [CDK ElastiCache Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_elasticache-readme.html}
 */
export class ElastiCacheManager {
  /**
   * @summary Method to create an elasticache resource
   * @param id scoped id of the resource
   * @param scope scope in which scope resource is defined
   * @param subnetIds
   */
  public createElastiCacheSubnetGroup(id: string, scope: CommonConstruct, subnetIds: string[]) {
    return new CfnSubnetGroup(scope, `${id}`, {
      cacheSubnetGroupName: `${id}-subnet-group-${scope.props.stage}`,
      description: `${id}-subnet-group-${scope.props.stage}`,
      subnetIds: subnetIds,
    })
  }

  /**
   * @summary Method to create an elasticache resource
   * @param id scoped id of the resource
   * @param scope scope in which scope resource is defined
   * @param props
   * @param subnetIds
   * @param securityGroupIds
   * @param logDeliveryConfigurations
   */
  public createElastiCache(
    id: string,
    scope: CommonConstruct,
    props: ElastiCacheProps,
    subnetIds: string[],
    securityGroupIds: string[],
    logDeliveryConfigurations?: any
  ) {
    if (!props) throw `ElastiCache props undefined for ${id}`

    const subnetGroup = this.createElastiCacheSubnetGroup(`${id}-subnetGroup`, scope, subnetIds)

    const elasticacheCluster = new CfnCacheCluster(scope, `${id}`, {
      autoMinorVersionUpgrade: props.autoMinorVersionUpgrade,
      azMode: props.azMode,
      cacheNodeType: props.cacheNodeType,
      cacheParameterGroupName: props.cacheParameterGroupName,
      cacheSecurityGroupNames: props.cacheSecurityGroupNames,
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
      clusterName: `${id}-${scope.props.stage}`,
      engine: props.engine,
      engineVersion: props.engineVersion,
      logDeliveryConfigurations: logDeliveryConfigurations,
      numCacheNodes: props.numCacheNodes,
      port: props.port,
      preferredAvailabilityZones: props.preferredAvailabilityZones,
      preferredMaintenanceWindow: props.preferredMaintenanceWindow,
      snapshotArns: props.snapshotArns,
      snapshotName: props.snapshotName,
      snapshotRetentionLimit: props.snapshotRetentionLimit,
      snapshotWindow: props.snapshotWindow,
      vpcSecurityGroupIds: securityGroupIds,
    })

    elasticacheCluster.addDependency(subnetGroup)

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(elasticacheCluster).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-clusterName`, scope, elasticacheCluster.clusterName)
    createCfnOutput(`${id}-redisEndpointPort`, scope, elasticacheCluster.attrRedisEndpointPort)
    createCfnOutput(`${id}-redisEndpointAddress`, scope, elasticacheCluster.attrRedisEndpointAddress)

    return elasticacheCluster
  }

  /**
   * @summary Method to create an replicated elasticache resource
   * @param id scoped id of the resource
   * @param scope scope in which scope resource is defined
   * @param props
   * @param subnetIds
   * @param securityGroupIds
   */
  public createReplicatedElastiCache(
    id: string,
    scope: CommonConstruct,
    props: ReplicatedElastiCacheProps,
    subnetIds: string[],
    securityGroupIds: string[]
  ) {
    if (!props) throw `ElastiCache props undefined for ${id}`

    const subnetGroup = this.createElastiCacheSubnetGroup(`${id}-subnetGroup`, scope, subnetIds)

    const elasticacheCluster = new CfnReplicationGroup(scope, `${id}`, {
      autoMinorVersionUpgrade: props.autoMinorVersionUpgrade,
      automaticFailoverEnabled: props.automaticFailoverEnabled,
      cacheNodeType: props.cacheNodeType,
      cacheParameterGroupName: props.cacheParameterGroupName,
      cacheSecurityGroupNames: props.cacheSecurityGroupNames,
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
      engine: props.engine,
      engineVersion: props.engineVersion,
      globalReplicationGroupId: props.globalReplicationGroupId,
      logDeliveryConfigurations: props.logDeliveryConfigurations,
      multiAzEnabled: props.multiAzEnabled,
      numCacheClusters: props.numCacheClusters,
      numNodeGroups: props.numNodeGroups,
      port: props.port,
      preferredCacheClusterAZs: props.preferredCacheClusterAZs,
      preferredMaintenanceWindow: props.preferredMaintenanceWindow,
      primaryClusterId: props.primaryClusterId,
      replicasPerNodeGroup: props.replicasPerNodeGroup,
      replicationGroupDescription: `${id} Redis Replication Cluster`,
      replicationGroupId: `${id}-${scope.props.stage}`,
      securityGroupIds: securityGroupIds,
    })

    elasticacheCluster.addDependency(subnetGroup)

    return elasticacheCluster
  }
}
