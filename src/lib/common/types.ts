import { ComponentResourceOptions } from '@pulumi/pulumi'

export interface BaseProps {
  debug?: boolean
  domainName: string
  extraContexts?: string[]
  name: string
  skipStageForARecords?: boolean
  stage: string
  stageContextPath?: string
  subDomain?: string
}

export interface BaseOptions extends ComponentResourceOptions {}
