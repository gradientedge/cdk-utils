import { BaseProps } from '../../common/index.js'

/**
 */
export interface CommonCloudflareStackProps extends BaseProps {
  accountId: string
  apiToken: string
  resourceGroupName?: string
  useExistingZone?: boolean
}
