import { Tags } from 'aws-cdk-lib'
import { CfnCacheCluster, CfnReplicationGroup, CfnSubnetGroup } from 'aws-cdk-lib/aws-elasticache'
import _ from 'lodash'

import { CommonConstruct } from '../../common/index.js'
import { createCfnOutput } from '../../utils/index.js'

import { ElastiCacheProps, ReplicatedElastiCacheProps } from './types.js'

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
 * @category Service
 */
export class ElastiCacheManager {
  /**
   * @summary Method to create an ElastiCache subnet group
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param subnetIds the list of subnet IDs to include in the subnet group
   */
  public createElastiCacheSubnetGroup(id: string, scope: CommonConstruct, subnetIds: string[]) {
    return new CfnSubnetGroup(scope, `${id}`, {
      cacheSubnetGroupName: `${id}-subnet-group-${scope.props.stage}`,
      description: `${id}-subnet-group-${scope.props.stage}`,
      subnetIds: subnetIds,
    })
  }

  /**
   * @summary Method to create an ElastiCache cache cluster
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the ElastiCache cluster properties
   * @param subnetIds the list of subnet IDs for the cache subnet group
   * @param securityGroupIds the list of VPC security group IDs to associate with the cluster
   * @param logDeliveryConfigurations optional log delivery configuration for the cluster
   */
  public createElastiCache(
    id: string,
    scope: CommonConstruct,
    props: ElastiCacheProps,
    subnetIds: string[],
    securityGroupIds: string[],
    logDeliveryConfigurations?: any
  ) {
    if (!props) throw new Error(`ElastiCache props undefined for ${id}`)
    if (!props.clusterName) throw new Error(`ElastiCache clusterName undefined for ${id}`)

    /* Create a dedicated subnet group before provisioning the cache cluster */
    const subnetGroup = this.createElastiCacheSubnetGroup(`${id}-subnetGroup`, scope, subnetIds)

    const elasticacheCluster = new CfnCacheCluster(scope, `${id}`, {
      ...props,
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
      clusterName: scope.resourceNameFormatter.format(props.clusterName, scope.props.resourceNameOptions?.elasticache),
      logDeliveryConfigurations,
      vpcSecurityGroupIds: securityGroupIds,
    })

    /* Ensure the subnet group is created before the cache cluster */
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
   * @summary Method to create a replicated ElastiCache replication group
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the replicated ElastiCache properties
   * @param subnetIds the list of subnet IDs for the cache subnet group
   * @param securityGroupIds the list of VPC security group IDs to associate with the replication group
   */
  public createReplicatedElastiCache(
    id: string,
    scope: CommonConstruct,
    props: ReplicatedElastiCacheProps,
    subnetIds: string[],
    securityGroupIds: string[]
  ) {
    if (!props) throw new Error(`ElastiCache props undefined for ${id}`)

    /* Create a dedicated subnet group before provisioning the replication group */
    const subnetGroup = this.createElastiCacheSubnetGroup(`${id}-subnetGroup`, scope, subnetIds)

    const elasticacheCluster = new CfnReplicationGroup(scope, `${id}`, {
      ...props,
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
      replicationGroupDescription: `${id} Redis Replication Cluster`,
      replicationGroupId: `${id}-${scope.props.stage}`,
      securityGroupIds,
    })

    /* Ensure the subnet group is created before the replication group */
    elasticacheCluster.addDependency(subnetGroup)

    return elasticacheCluster
  }
}
