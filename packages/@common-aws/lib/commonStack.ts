import * as cdk from '@aws-cdk/core'
import { Route53Props } from './route53Manager'
import { S3BucketProps } from './s3Manager'
import { AcmProps } from './acmManager'
import { CloudFrontProps } from './cloudFrontManager'
import { LogProps } from './logManager'
import { CloudTrailProps } from './cloudTrailManager'
import { VpcProps } from '@aws-cdk/aws-ec2'
import { EcsClusterProps } from './ecsManager'
import { EksClusterProps } from './eksManager'
import { LambdaProps } from './lambdaManager'
import { SubscriptionProps } from './snsManager'

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
  trails?: CloudTrailProps[]
  vpc?: VpcProps
  ecsClusters?: EcsClusterProps[]
  eksClusters?: EksClusterProps[]
  lambdas?: LambdaProps[]
  subscriptions?: SubscriptionProps[]
}
