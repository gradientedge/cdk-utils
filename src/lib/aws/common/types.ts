import { StackProps } from 'aws-cdk-lib'
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { BaseProps } from '../../common/index.js'

/**
 */
export interface CommonStackProps extends BaseProps, StackProps {
  region: string
  resourceProjectIdentifier?: string
  globalPrefix?: string
  globalSuffix?: string
  resourcePrefix?: string
  resourceSuffix?: string
  logRetention?: RetentionDays
  defaultReservedLambdaConcurrentExecutions?: number
  defaultTracing?: Tracing
  excludeDomainNameForBuckets?: boolean
  excludeAccountNumberForBuckets?: boolean
  nodejsRuntime?: Runtime
  resourceNameOptions?: { [key: string]: ResourceNameFormatterProps }
}

export interface ResourceNameFormatterProps {
  exclude?: boolean
  globalPrefix?: boolean
  globalSuffix?: boolean
  prefix?: string
  suffix?: string
}
