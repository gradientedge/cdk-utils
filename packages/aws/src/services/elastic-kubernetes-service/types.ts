import { ClusterProps } from 'aws-cdk-lib/aws-eks'

/**
 * Properties for creating an EKS cluster with application deployment.
 * @see {@link ClusterProps}
 */
/** @category Interface */
export interface EksClusterProps extends ClusterProps {
  /** The number of default capacity instances to provision in the cluster */
  appCapacity: number
  /** The container port the application listens on */
  appContainerPort: number
}
