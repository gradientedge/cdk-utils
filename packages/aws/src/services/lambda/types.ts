import { Alias, AliasProps, Function, FunctionProps } from 'aws-cdk-lib/aws-lambda'
import { SqsEventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources'

import { TagProps } from '../../types/index.js'
import { QueueProps } from '../simple-queue-service/index.js'

/**
 * A Function returned by {@link LambdaManager.createLambdaFunction} when the
 * caller supplied {@link LambdaProps.lambdaAliases}. The aliases that were
 * created are exposed under `lambdaAliases`, keyed by aliasName, so downstream
 * constructs can pass them directly to integrations (e.g. ApiGateway's
 * LambdaIntegration) instead of re-importing by ARN — which carries an
 * UnclearLambdaEnvironment warning and silently drops the invoke permission
 * when CDK can't statically prove same-env.
 */
/** @category Interface */
export type FunctionWithAliases = Function & {
  lambdaAliases?: Record<string, Alias>
}

/**
 * Props for Lambda@Edge function, matching aws-cdk-lib experimental EdgeFunctionProps.
 * Inlined because aws-cdk-lib does not export this subpath via its package exports map.
 */
/** @category Interface */
export interface EdgeFunctionProps extends FunctionProps {
  /** Optional stack ID for the edge function's dedicated stack */
  readonly stackId?: string
}

/**
 * Properties for configuring provisioned concurrency auto-scaling on a Lambda alias.
 */
/** @category Interface */
export interface ProvisionedConcurrencyProps {
  /** Maximum number of provisioned concurrency instances to scale out to */
  maxCapacity: number
  /** Minimum number of provisioned concurrency instances to maintain */
  minCapacity: number
  /** Target utilization percentage to trigger scaling (0-1) */
  utilizationTarget: number
}

/**
 * Properties for creating a Lambda function.
 * @see {@link FunctionProps}
 */
/** @category Interface */
export interface LambdaProps extends FunctionProps {
  /** Optional dead letter queue configuration for failed invocations */
  dlq?: QueueProps
  /** When true, excludes the last modified timestamp from asset hashing */
  excludeLastModifiedTimestamp?: boolean
  /** Optional list of aliases to create for the function */
  lambdaAliases?: LambdaAliasProps[]
  /** The log level to set as an environment variable */
  logLevel?: string
  /** Log retention period in days */
  logRetentionInDays?: number
  /** Optional redrive queue configuration for reprocessing failed messages */
  redriveq?: QueueProps
  /** Optional tags to apply to the Lambda function */
  tags?: TagProps[]
  /** Function timeout in seconds, defaults to 15 minutes */
  timeoutInSecs?: number
}

/**
 * Properties for creating a Lambda function alias with optional provisioned concurrency.
 * @see {@link AliasProps}
 */
/** @category Interface */
export interface LambdaAliasProps extends AliasProps {
  /** Optional custom logical ID for the alias resource */
  id?: string
  /** Optional provisioned concurrency auto-scaling configuration */
  provisionedConcurrency?: ProvisionedConcurrencyProps
}

/**
 * Properties for creating a Lambda@Edge function.
 * @see {@link EdgeFunctionProps}
 */
/** @category Interface */
export interface LambdaEdgeProps extends EdgeFunctionProps {
  /** Optional tags to apply to the edge function */
  tags?: TagProps[]
  /** Function timeout in seconds, defaults to 1 minute */
  timeoutInSecs?: number
}

/**
 * Standard environment variables injected into Lambda functions.
 */
/** @category Interface */
export interface LambdaEnvironment {
  /** The application log level (e.g. 'debug', 'info', 'warn', 'error') */
  LOG_LEVEL: string
  /** The Node.js environment (e.g. 'production', 'development') */
  NODE_ENV: string
  /** Optional AWS region override */
  REGION?: string
  /** Optional deployment stage (e.g. 'dev', 'staging', 'prod') */
  STAGE?: string
  /** The timezone for the function runtime */
  TZ: string
}

/**
 * Properties for configuring an SQS event source for a Lambda function.
 * @see {@link SqsEventSourceProps}
 */
/** @category Interface */
export interface SQSEventSourceProps extends SqsEventSourceProps {
  /** The maximum batching window in seconds before invoking the function */
  maxBatchingWindowInSecs: number
}
