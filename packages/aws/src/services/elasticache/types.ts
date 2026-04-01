import { CfnCacheClusterProps, CfnReplicationGroupProps } from 'aws-cdk-lib/aws-elasticache'

/**
 */
export interface ElastiCacheProps extends CfnCacheClusterProps {}

/**
 */
export interface ReplicatedElastiCacheProps extends CfnReplicationGroupProps {}
