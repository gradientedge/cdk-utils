import { BaseProps } from '@gradientedge/cdk-utils-common'

/**
 */
export interface CommonCloudflareStackProps extends BaseProps {
  accountId: string
  apiToken: string
  resourceGroupName?: string
  useExistingZone?: boolean
}
