import { CloudflareProviderConfig } from '@cdktf/provider-cloudflare/lib/provider'
import { BaseProps } from '../../common'

/**
 */
export interface CommonCloudflareStackProps extends BaseProps, CloudflareProviderConfig {
  accountId: string
  apiToken: string
  useExistingZone?: boolean
}
