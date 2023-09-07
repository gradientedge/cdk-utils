import { Construct } from 'constructs'
import { BaseProps } from './types'

export abstract class BaseConstruct extends Construct {
  props: BaseProps

  /**
   * @summary Determine the fully qualified domain name based on domainName & subDomain
   */
  public abstract determineFullyQualifiedDomain(): void

  /**
   * @summary Utility method to determine if the initialisation is in development (dev) stage
   * This is determined by the stage property injected via cdk context
   */
  public abstract isDevelopmentStage(): void

  /**
   * @summary Utility method to determine if the initialisation is in test (tst) stage
   * This is determined by the stage property injected via cdk context
   */
  public abstract isTestStage(): void

  /**
   * @summary Utility method to determine if the initialisation is in uat (uat) stage
   * This is determined by the stage property injected via cdk context
   */
  public abstract isUatStage(): void

  /**
   * @summary Utility method to determine if the initialisation is in production (prd) stage
   * This is determined by the stage property injected via cdk context
   */
  public abstract isProductionStage(): void
}
