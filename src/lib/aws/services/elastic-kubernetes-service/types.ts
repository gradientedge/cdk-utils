import { ClusterProps } from 'aws-cdk-lib/aws-eks'
import { ResourceNameFormatterProps } from '../../common'

/**
 */
export interface EksClusterProps extends ClusterProps {
  appCapacity: number
  appContainerPort: number
  resourceNameOptions?: ResourceNameFormatterProps
}
