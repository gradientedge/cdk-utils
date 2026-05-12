import * as pulumi from '@pulumi/pulumi'

/**
 * Base properties shared by Azure configuration interfaces that require a resource group
 * @category Interface
 */
export interface BaseAzureConfigProps {
  /** The Azure resource group name in which the resource is deployed */
  resourceGroupName: pulumi.Input<string>
}
