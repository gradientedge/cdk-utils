import { IPeer, Port } from 'aws-cdk-lib/aws-ec2'

import { RestApiLambdaProps } from '../rest-api-lambda/index.js'
import { ReplicatedElastiCacheProps, VpcProps } from '../../services/index.js'

/**
 * An ingress rule for the security group created by {@link RestApiLambdaWithCache}
 */
/** @category Interface */
export interface RestApiLambdaWithCacheIngressRuleProps {
  /** The peer to allow ingress from */
  peer: IPeer
  /** The port range to allow ingress on */
  port: Port
  /** Optional description for the rule */
  description?: string
}

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
  /**
   * Ingress rules for the security group created when securityGroupExportName is not set.
   * Defaults to a single self-referencing rule allowing the Lambda function to reach the
   * ElastiCache cluster on its configured port (6379 if unset). No ingress is added when
   * no cache is configured.
   */
  securityGroupIngressRules?: RestApiLambdaWithCacheIngressRuleProps[]
  /** Whether to look up an existing VPC instead of creating one */
  useExistingVpc: boolean
  /** Name of an existing VPC to look up */
  vpcName?: string
}
