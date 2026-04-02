import { DefenderForStorage } from '@pulumi/azure-native/security/index.js'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { DefenderForStorageProps } from './types.js'

/**
 * Provides operations on Azure Security Center using Pulumi
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```typescript
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     this.props = props
 *     this.securityCenterManager.createDefenderForStorage('MyDefender', this, props)
 *   }
 * }
 * ```
 * @category Service
 */
export class AzureSecurityCentermanager {
  /**
   * @summary Method to create a new defender for storage account
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props defender for storage account properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Defender For Storage]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/security/defenderforstorage/}
   */
  public createDefenderForStorage(
    id: string,
    scope: CommonAzureConstruct,
    props: DefenderForStorageProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new DefenderForStorage(`${id}`, props, { parent: scope, ...resourceOptions })
  }
}
