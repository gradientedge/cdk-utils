import { CfnCacheClusterProps, CfnReplicationGroupProps } from 'aws-cdk-lib/aws-elasticache'
import { ResourceNameFormatterProps } from '../../common'

/**
 */
export interface ElastiCacheProps extends CfnCacheClusterProps {
  resourceNameOptions?: ResourceNameFormatterProps
}

/**
 */
export interface ReplicatedElastiCacheProps extends CfnReplicationGroupProps {}
