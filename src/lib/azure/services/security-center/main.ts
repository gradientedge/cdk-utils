import { DefenderForStorage } from '@pulumi/azure-native/security/index.js'
import { ResourceOptions } from '@pulumi/pulumi'
import { CommonAzureConstruct } from '../../common/index.js'
import { DefenderForStorageProps } from './types.js'

export class AzureSecurityCentermanager {
  /**
   * @summary Method to create a new defender for storage account
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props defender for storage account properties
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public createDefenderForStorage(
    id: string,
    scope: CommonAzureConstruct,
    props: DefenderForStorageProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    return new DefenderForStorage(`${id}`, props, { parent: scope, ...resourceOptions })
  }
}
