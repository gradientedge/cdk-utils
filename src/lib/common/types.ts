export interface BaseProps {
  domainName: string
  extraContexts?: string[]
  name: string
  skipStageForARecords: boolean
  stage: string
  stageContextPath?: string
  subDomain?: string
}
