import { CloudflareProviderConfig } from '@cdktf/provider-cloudflare/lib/provider'
import { BaseProps } from '../../common'
import { RemoteBackend } from './constants'

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
  globalPrefix?: string
  globalSuffix?: string
  resourcePrefix?: string
  resourceSuffix?: string
}
