import { Construct } from 'constructs'
import { BaseProps } from './types'

export abstract class BaseStack extends Construct {
  props: BaseProps

  /**
   * @summary Method to determine the core CDK construct properties injected via context cdktf.json
   */
  protected abstract determineConstructProps(props: BaseProps): void

  /**
   * @summary Method to determine extra cdk contexts apart from the main cdktf.json
   */
  public abstract determineExtraContexts(): void

  /**
   * @summary Method to determine extra cdk stage contexts apart from the main cdktf.json
   */
  public abstract determineStageContexts(): void

  /**
   * @summary Determine the fully qualified domain name based on domainName & subDomain
   */
  public abstract fullyQualifiedDomain(): void
}
