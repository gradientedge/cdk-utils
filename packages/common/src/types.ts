/**
 * Base properties shared across all constructs and stacks
 */
/** @category Interface */
export interface BaseProps {
  /** Enable debug logging output */
  debug?: boolean
  /** The root domain name for the deployment */
  domainName: string
  /** Additional CDK context file paths to load */
  extraContexts?: string[]
  /** The name identifier for the stack or construct */
  name: string
  /** Whether to omit the stage prefix for Route53 A records */
  skipStageForARecords?: boolean
  /** The deployment stage (e.g. dev, tst, uat, prd) */
  stage: string
  /** The relative path to stage-specific context files */
  stageContextPath?: string
  /** The subdomain prefix for the deployment */
  subDomain?: string
}
