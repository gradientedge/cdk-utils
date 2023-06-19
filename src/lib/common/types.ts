import * as cdk from 'aws-cdk-lib'
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'

/**
 */
export interface CommonStackProps extends cdk.StackProps {
  name: string
  region: string
  stage: string
  domainName: string
  subDomain?: string
  extraContexts?: string[]
  stageContextPath?: string
  skipStageForARecords: boolean
  logRetention?: RetentionDays
  defaultReservedLambdaConcurrentExecutions?: number
  defaultTracing?: Tracing
  excludeDomainNameForBuckets?: boolean
  nodejsRuntime?: Runtime
}
