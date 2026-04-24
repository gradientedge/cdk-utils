import { StackProps } from 'aws-cdk-lib'
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { BaseProps } from '@gradientedge/cdk-utils-common'

/**
 * Common stack properties shared across all AWS constructs and stacks
 */
/** @category Interface */
export interface CommonStackProps extends BaseProps, StackProps {
  /** The AWS region for resource deployment */
  region: string
  /** Optional project identifier used in resource naming */
  resourceProjectIdentifier?: string
  /** Global prefix prepended to all resource names */
  globalPrefix?: string
  /** Global suffix appended to all resource names */
  globalSuffix?: string
  /** Default prefix for resource names */
  resourcePrefix?: string
  /** Default suffix for resource names */
  resourceSuffix?: string
  /** The log retention period for CloudWatch log groups */
  logRetention?: RetentionDays
  /** The default reserved concurrent executions for Lambda functions */
  defaultReservedLambdaConcurrentExecutions?: number
  /** The default tracing configuration for Lambda functions */
  defaultTracing?: Tracing
  /** Whether to exclude the domain name from S3 bucket names */
  excludeDomainNameForBuckets?: boolean
  /** Whether to exclude the account number from S3 bucket names */
  excludeAccountNumberForBuckets?: boolean
  /** The Node.js runtime version for Lambda functions */
  nodejsRuntime?: Runtime
  /** Per-service resource name formatting options */
  resourceNameOptions?: { [key: string]: ResourceNameFormatterProps }
}

/**
 * Options for controlling how a resource name is formatted
 */
/** @category Interface */
export interface ResourceNameFormatterProps {
  /** Whether to exclude the prefix and suffix from the formatted name */
  exclude?: boolean
  /** Whether to include the global prefix */
  globalPrefix?: boolean
  /** Whether to include the global suffix */
  globalSuffix?: boolean
  /** Custom prefix to use instead of the default resource prefix */
  prefix?: string
  /** Custom suffix to use instead of the default resource suffix */
  suffix?: string
}
