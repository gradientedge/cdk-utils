import { CloudflareProviderConfig } from '@cdktf/provider-cloudflare/lib/provider/index.js'
import { BaseProps } from '../../common/index.js'
import { RemoteBackend } from './constants.js'

export interface RemoteBackendProps {
  bucketName: string
  region: string
  tableName: string
  type: RemoteBackend
  storageAccountName: string
  containerName: string
  subscriptionId: string
  resourceGroupName: string
}

/**
 */
export interface CommonCloudflareStackProps extends BaseProps, CloudflareProviderConfig {
  accountId: string
  apiToken: string
  remoteBackend?: RemoteBackendProps
  useExistingZone?: boolean
}
