import { AzurermProvider } from '@cdktf/provider-azurerm/lib/provider'
import { TerraformStack } from 'cdktf'
import { Construct } from 'constructs'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '../../common'
import { AzureStorageManager } from '../services'
import { CommonAzureStackProps } from './types'

export class CommonAzureConstruct extends TerraformStack {
  declare props: CommonAzureStackProps
  id: string
  fullyQualifiedDomainName: string
  storageManager: AzureStorageManager

  constructor(scope: Construct, id: string, props: CommonAzureStackProps) {
    super(scope, id)
    this.props = props
    this.id = id

    this.storageManager = new AzureStorageManager()

    this.determineFullyQualifiedDomain()
    new AzurermProvider(this, `${this.id}-provider`, this.props)
  }

  /**
   * @summary Determine the fully qualified domain name based on domainName & subDomain
   */
  protected determineFullyQualifiedDomain(): void {
    this.fullyQualifiedDomainName = this.props.subDomain
      ? `${this.props.subDomain}.${this.props.domainName}`
      : this.props.domainName
  }

  /**
   * @summary Utility method to determine if the initialisation is in development (dev) stage
   * This is determined by the stage property injected via cdk context
   */
  public isDevelopmentStage = () => isDevStage(this.props.stage)

  /**
   * @summary Utility method to determine if the initialisation is in test (tst) stage
   * This is determined by the stage property injected via cdk context
   */
  public isTestStage = () => isTestStage(this.props.stage)

  /**
   * @summary Utility method to determine if the initialisation is in uat (uat) stage
   * This is determined by the stage property injected via cdk context
   */
  public isUatStage = () => isUatStage(this.props.stage)

  /**
   * @summary Utility method to determine if the initialisation is in production (prd) stage
   * This is determined by the stage property injected via cdk context
   */
  public isProductionStage = () => isPrdStage(this.props.stage)
}
