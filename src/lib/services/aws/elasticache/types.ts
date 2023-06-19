import { CfnCacheClusterProps, CfnReplicationGroupProps } from 'aws-cdk-lib/aws-elasticache'

/**
 * @category cdk-utils.elasticache-manager
 * @category Compute
 */
export interface ElastiCacheProps extends CfnCacheClusterProps {}

/**
 * @category cdk-utils.elasticache-manager
 * @category Compute
 */
export interface ReplicatedElastiCacheProps extends CfnReplicationGroupProps {}
