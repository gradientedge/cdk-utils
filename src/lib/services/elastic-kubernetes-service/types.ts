import { ClusterProps } from 'aws-cdk-lib/aws-eks'

/**
 */
export interface EksClusterProps extends ClusterProps {
  appCapacity: number
  appContainerPort: number
}
