import * as cdk from '@aws-cdk/core'
import { Route53Props } from './route53Manager'
import { S3BucketProps } from './s3Manager'
import { AcmProps } from './acmManager'
import { CloudFrontProps } from './cloudFrontManager'
import { LogProps, MetricFilterProps } from './logManager'
import { CloudTrailProps } from './cloudTrailManager'
import { VpcProps } from '@aws-cdk/aws-ec2'
import { EcsClusterProps, EcsTaskProps } from './ecsManager'
import { EksClusterProps } from './eksManager'
import { LambdaProps } from './lambdaManager'
import { SubscriptionProps } from './snsManager'
import { RuleProps } from './eventManager'
import { DashboardProps } from './cloudWatchManager'

export interface CommonStackProps extends cdk.StackProps {
  name: string
  region: string
  stage: string
  domainName: string
  subDomain?: string
  routes?: Route53Props[]
  buckets?: S3BucketProps[]
  certificates?: AcmProps[]
  distributions?: CloudFrontProps[]
  logs?: LogProps[]
  rules?: RuleProps[]
  trails?: CloudTrailProps[]
  vpc?: VpcProps
  ecsClusters?: EcsClusterProps[]
  ecsTasks?: EcsTaskProps[]
  eksClusters?: EksClusterProps[]
  lambdas?: LambdaProps[]
  subscriptions?: SubscriptionProps[]
  dashboards?: DashboardProps[]
  widgets?: any[]
  metricFilters?: MetricFilterProps[]
}
