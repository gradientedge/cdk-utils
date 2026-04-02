import { AliasProps, FunctionProps } from 'aws-cdk-lib/aws-lambda'
import { SqsEventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources'

import { TagProps } from '../../types/index.js'
import { QueueProps } from '../simple-queue-service/index.js'

/**
 * Props for Lambda@Edge function, matching aws-cdk-lib experimental EdgeFunctionProps.
 * Inlined because aws-cdk-lib does not export this subpath via its package exports map.
 */
/** @category Interface */
export interface EdgeFunctionProps extends FunctionProps {
  readonly stackId?: string
}

/**
 */
/** @category Interface */
export interface ProvisionedConcurrencyProps {
  maxCapacity: number
  minCapacity: number
  utilizationTarget: number
}

/**
 */
/** @category Interface */
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
/** @category Interface */
export interface LambdaAliasProps extends AliasProps {
  id?: string
  provisionedConcurrency?: ProvisionedConcurrencyProps
}

/**
 */
/** @category Interface */
export interface LambdaEdgeProps extends EdgeFunctionProps {
  tags?: TagProps[]
  timeoutInSecs?: number
}

/**
 */
/** @category Interface */
export interface LambdaEnvironment {
  LOG_LEVEL: string
  NODE_ENV: string
  REGION?: string
  STAGE?: string
  TZ: string
}

/** @category Interface */
export interface SQSEventSourceProps extends SqsEventSourceProps {
  maxBatchingWindowInSecs: number
}
