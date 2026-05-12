import { RestApiLambdaProps } from '../rest-api-lambda/index.js'
import { ReplicatedElastiCacheProps, VpcProps } from '../../services/index.js'

/**
 * Properties for configuring a {@link RestApiLambdaWithCache} construct
 */
/** @category Interface */
export interface RestApiLambdaWithCacheProps extends RestApiLambdaProps {
  /** The ElastiCache replication group configuration */
  restApiCache: ReplicatedElastiCacheProps
  /** The VPC configuration for the Lambda function and cache */
  restApiVpc: VpcProps
  /** CloudFormation export name for an existing security group */
  securityGroupExportName: string
  /** Whether to look up an existing VPC instead of creating one */
  useExistingVpc: boolean
  /** Name of an existing VPC to look up */
  vpcName?: string
}
