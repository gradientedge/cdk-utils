import { BaseProps } from '@gradientedge/cdk-utils-common'

/**
 * Common properties for all Cloudflare stacks and constructs
 * @category Interface
 */
export interface CommonCloudflareStackProps extends BaseProps {
  /** The Cloudflare account identifier */
  accountId: string
  /** The Cloudflare API token used for authentication */
  apiToken: string
  /** Optional Azure resource group name used when resolving secrets from Azure Key Vault */
  resourceGroupName?: string
  /** Whether to use an existing Cloudflare zone instead of creating a new one */
  useExistingZone?: boolean
}
