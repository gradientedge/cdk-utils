import { AzurermProvider } from '@cdktf/provider-azurerm/lib/provider'
import { AzurermBackend, TerraformStack } from 'cdktf'
import { Construct } from 'constructs'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '../../common'
import {
  AzureStorageManager,
  AzureKeyVaultManager,
  AzureApiManagementManager,
  AzureFunctionManager,
  AzureResourceGroupManager,
} from '../services'
import { CommonAzureStackProps } from './types'
import { AzureRemoteBackend } from './constants'

export class CommonAzureConstruct extends TerraformStack {
  declare props: CommonAzureStackProps
  id: string
  fullyQualifiedDomainName: string
  apiManagementtManager: AzureApiManagementManager
  functiontManager: AzureFunctionManager
  keyVaultManager: AzureKeyVaultManager
  resourceGroupManager: AzureResourceGroupManager
  storageManager: AzureStorageManager

  constructor(scope: Construct, id: string, props: CommonAzureStackProps) {
    super(scope, id)
    this.props = props
    this.id = id

    this.apiManagementtManager = new AzureApiManagementManager()
    this.functiontManager = new AzureFunctionManager()
    this.keyVaultManager = new AzureKeyVaultManager()
    this.resourceGroupManager = new AzureResourceGroupManager()
    this.storageManager = new AzureStorageManager()

    this.determineFullyQualifiedDomain()
    this.determineRemoteBackend()
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

  protected determineRemoteBackend() {
    const debug = this.node.tryGetContext('debug')
    switch (this.props.remoteBackend?.type) {
      case AzureRemoteBackend.azurerm:
        new AzurermBackend(this, {
          storageAccountName: this.props.remoteBackend.storageAccountName,
          containerName: this.props.remoteBackend.containerName,
          key: `${this.id}`,
          subscriptionId: this.props.subscriptionId,
          resourceGroupName: this.props.remoteBackend.resourceGroupName,
        })
        break
      case AzureRemoteBackend.local:
        if (debug) console.debug(`Using local backend for ${this.id}`)
        break
      default:
        break
    }
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
