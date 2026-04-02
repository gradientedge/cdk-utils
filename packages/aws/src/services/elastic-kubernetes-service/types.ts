import { ClusterProps } from 'aws-cdk-lib/aws-eks'

/**
 */
/** @category Interface */
export interface EksClusterProps extends ClusterProps {
  appCapacity: number
  appContainerPort: number
}
