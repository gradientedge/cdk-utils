import { EdgeFunctionProps } from 'aws-cdk-lib/aws-cloudfront/lib/experimental/edge-function.js'
import { AliasProps, FunctionProps } from 'aws-cdk-lib/aws-lambda'
import { SqsEventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources'
import { TagProps } from '../../types/index.js'
import { QueueProps } from '../simple-queue-service/index.js'

/**
 */
export interface ProvisionedConcurrencyProps {
  maxCapacity: number
  minCapacity: number
  utilizationTarget: number
}

/**
 */
export interface LambdaProps extends FunctionProps {
  dlq?: QueueProps
  excludeLastModifiedTimestamp?: boolean
  lambdaAliases?: LambdaAliasProps[]
  logLevel?: string
  logRetentionInDays?: number
  redriveq?: QueueProps
  tags?: TagProps[]
  timeoutInSecs?: number
}

/**
 */
export interface LambdaAliasProps extends AliasProps {
  id?: string
  provisionedConcurrency?: ProvisionedConcurrencyProps
}

/**
 */
export interface LambdaEdgeProps extends EdgeFunctionProps {
  tags?: TagProps[]
  timeoutInSecs?: number
}

/**
 */
export interface LambdaEnvironment {
  LOG_LEVEL: string
  NODE_ENV: string
  REGION?: string
  STAGE?: string
  TZ: string
}

export interface SQSEventSourceProps extends SqsEventSourceProps {
  maxBatchingWindowInSecs: number
}
