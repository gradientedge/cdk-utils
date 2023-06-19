import { AliasProps, FunctionProps } from 'aws-cdk-lib/aws-lambda'
import { TagProps } from '../../../types'
import { EdgeFunctionProps } from 'aws-cdk-lib/aws-cloudfront/lib/experimental'
import { QueueProps } from '../simple-queue-service'

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Properties
 */
export interface ProvisionedConcurrencyProps {
  minCapacity: number
  maxCapacity: number
  utilizationTarget: number
}

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Properties
 */
export interface LambdaProps extends FunctionProps {
  dlq?: QueueProps
  redriveq?: QueueProps
  timeoutInSecs?: number
  excludeLastModifiedTimestamp?: boolean
  tags?: TagProps[]
  lambdaAliases?: LambdaAliasProps[]
}

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Properties
 */
export interface LambdaAliasProps extends AliasProps {
  id?: string
  provisionedConcurrency?: ProvisionedConcurrencyProps
}

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Properties
 */
export interface LambdaEdgeProps extends EdgeFunctionProps {
  timeoutInSecs?: number
  tags?: TagProps[]
}

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Types
 */
export interface LambdaEnvironment {
  NODE_ENV: string
  LOG_LEVEL: string
  REGION?: string
  STAGE?: string
  TZ: string
}
