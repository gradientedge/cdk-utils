import { StackProps } from 'aws-cdk-lib'
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { BaseProps } from '../../common'

/**
 */
export interface CommonStackProps extends BaseProps, StackProps {
  region: string
  logRetention?: RetentionDays
  defaultReservedLambdaConcurrentExecutions?: number
  defaultTracing?: Tracing
  excludeDomainNameForBuckets?: boolean
  nodejsRuntime?: Runtime
}
