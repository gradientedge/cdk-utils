import { ClusterProps } from 'aws-cdk-lib/aws-eks'

/**
 * @category cdk-utils.eks-manager
 * @subcategory Properties
 */
export interface EksClusterProps extends ClusterProps {
  appContainerPort: number
  appCapacity: number
}
