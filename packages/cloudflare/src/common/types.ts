import { BaseProps } from '@gradientedge/cdk-utils-common'

/**
 */
/** @category Interface */
export interface CommonCloudflareStackProps extends BaseProps {
  accountId: string
  apiToken: string
  resourceGroupName?: string
  useExistingZone?: boolean
}
