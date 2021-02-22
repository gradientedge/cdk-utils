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
import { AlarmProps, DashboardProps } from './cloudWatchManager'
import { CommonConstruct } from './commonConstruct'

const appRoot = require('app-root-path')
const fs = require('fs')

export class CommonStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.determineExtraContexts()
    this.determineStageContexts()
    new CommonConstruct(this, 'ge-common', this.determineConstructProps(props))
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      stackName: props.stackName,
      name: props.stackName || 'ge-common',
      region: this.node.tryGetContext('region'),
      stage: this.node.tryGetContext('stage'),
      domainName: this.node.tryGetContext('domainName'),
      subDomain: this.node.tryGetContext('subDomain'),
      extraContexts: this.node.tryGetContext('extraContexts'),
      routes: this.node.tryGetContext('routes'),
      buckets: this.node.tryGetContext('buckets'),
      certificates: this.node.tryGetContext('certificates'),
      distributions: this.node.tryGetContext('distributions'),
      logs: this.node.tryGetContext('logs'),
      rules: this.node.tryGetContext('rules'),
      trails: this.node.tryGetContext('trails'),
      vpc: this.node.tryGetContext('vpc'),
      ecsClusters: this.node.tryGetContext('ecsClusters'),
      ecsTasks: this.node.tryGetContext('ecsTasks'),
      eksClusters: this.node.tryGetContext('eksClusters'),
      lambdas: this.node.tryGetContext('lambdas'),
      subscriptions: this.node.tryGetContext('subscriptions'),
      metricFilters: this.node.tryGetContext('metricFilters'),
      dashboards: this.node.tryGetContext('dashboards'),
      widgets: this.node.tryGetContext('widgets'),
      alarms: this.node.tryGetContext('alarms'),
    }
  }

  protected determineExtraContexts() {
    const extraContexts = this.node.tryGetContext('extraContexts')

    if (!extraContexts) {
      console.info(
        `No additional contexts provided. Using default context properties from cdk.json`
      )
      return
    }

    extraContexts.forEach((context: string) => {
      const extraContextPath = `${appRoot.path}/${context}`
      if (!fs.existsSync(extraContextPath))
        throw `Extra context properties unavailable in path:${extraContextPath}`

      const extraContextPropsBuffer = fs.readFileSync(extraContextPath)
      console.info(`Adding additional contexts provided in ${extraContextPath}`)
      const extraContextProps = JSON.parse(extraContextPropsBuffer)
      Object.keys(extraContextProps).forEach((propKey: any) => {
        this.node.setContext(propKey, extraContextProps[propKey])
      })
    })
  }

  protected determineStageContexts() {
    const stage = this.node.tryGetContext('stage')
    const stageContextPath = this.node.tryGetContext('stageContextPath') || 'cdkEnv'
    const stageContextFilePath = `${appRoot.path}/${stageContextPath}/${stage}.json`

    if (stage === 'dev') {
      console.info(`Development stage. Using default stage context properties`)
      return
    }

    if (!fs.existsSync(stageContextFilePath)) {
      console.warn(`Stage specific context properties unavailable in path:${stageContextFilePath}`)
      console.warn(`Using default stage context properties for ${stage} stage`)
    }

    const stageContextPropsBuffer = fs.readFileSync(stageContextFilePath)
    console.info(`Adding additional stage contexts provided in ${stageContextFilePath}`)
    const stageContextProps = JSON.parse(stageContextPropsBuffer)
    Object.keys(stageContextProps).forEach((propKey: any) => {
      this.node.setContext(propKey, {
        ...this.node.tryGetContext(propKey),
        ...stageContextProps[propKey],
      })
    })
  }
}

export interface CommonStackProps extends cdk.StackProps {
  name: string
  region: string
  stage: string
  domainName: string
  subDomain?: string
  extraContexts?: string[]
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
  alarms?: AlarmProps[]
}
