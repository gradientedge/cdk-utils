import { CfnCacheClusterProps, CfnReplicationGroupProps } from 'aws-cdk-lib/aws-elasticache'

/**
 * Properties for creating an ElastiCache cache cluster.
 * @see {@link CfnCacheClusterProps}
 */
/** @category Interface */
export interface ElastiCacheProps extends CfnCacheClusterProps {}

/**
 * Properties for creating an ElastiCache replication group.
 * @see {@link CfnReplicationGroupProps}
 */
/** @category Interface */
export interface ReplicatedElastiCacheProps extends CfnReplicationGroupProps {}
