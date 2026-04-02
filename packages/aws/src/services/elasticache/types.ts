import { CfnCacheClusterProps, CfnReplicationGroupProps } from 'aws-cdk-lib/aws-elasticache'

/**
 */
/** @category Interface */
export interface ElastiCacheProps extends CfnCacheClusterProps {}

/**
 */
/** @category Interface */
export interface ReplicatedElastiCacheProps extends CfnReplicationGroupProps {}
